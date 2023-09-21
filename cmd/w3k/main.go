/*
 * The MIT License (MIT)
 * Copyright (c) 2023 Cisco and/or its affiliates. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	cli "github.com/cristalhq/acmd"

	"github.com/cisco-open/nasp/pkg/tls"
)

type CommandContext struct {
	UID         int    `json:"uid,omitempty"`
	GID         int    `json:"gid,omitempty"`
	PID         int    `json:"pid,omitempty"`
	CommandName string `json:"command_name,omitempty"`
	CommandPath string `json:"command_path,omitempty"`
}

type Command struct {
	Context    CommandContext `json:"context,omitempty"`
	ID         string         `json:"id,omitempty"`
	Command    string         `json:"command"`
	Name       string         `json:"name,omitempty"`
	Code       []byte         `json:"code,omitempty"`
	Entrypoint string         `json:"entrypoint,omitempty"`
	Data       string         `json:"data,omitempty"`
}

type Answer struct {
	ID      string `json:"id"`
	Command string `json:"command"`
	Answer  string `json:"answer,omitempty"`
	Error   string `json:"error,omitempty"`
}

type CommandHandler interface {
	HandleCommand(c Command) (string, error)
}

type CommandHandlerFunc func(Command) (string, error)

func (f CommandHandlerFunc) HandleCommand(c Command) (string, error) {
	return f(c)
}

func AcceptOk(Command) (string, error) {
	return "ok", nil
}

func ConnectOk(Command) (string, error) {
	return "ok", nil
}

type loadFlags struct {
	File       string
	Name       string
	Entrypoint string
}

func (c *loadFlags) Flags() *flag.FlagSet {
	fs := flag.NewFlagSet("", flag.ContinueOnError)
	fs.StringVar(&c.File, "file", "my-module.wasm", "the file path of the loaded Wasm module")
	fs.StringVar(&c.Name, "name", "", "how to name the loaded Wasm module")
	fs.StringVar(&c.Entrypoint, "entrypoint", "", "initial function to invoke after loading the Wasm module")

	return fs
}

type serverFlags struct {
	CAPemFileName string
}

func (c *serverFlags) Flags() *flag.FlagSet {
	fs := flag.NewFlagSet("", flag.ContinueOnError)
	fs.StringVar(&c.CAPemFileName, "ca-pem-filename", "", "root CA pem location for CA signer")

	return fs
}

var ErrInvalidCommand = errors.New("invalid command")

var commandHandlers map[string]CommandHandler

func init() {
	commandHandlers = map[string]CommandHandler{
		"accept":  CommandHandlerFunc(AcceptOk),
		"connect": CommandHandlerFunc(ConnectOk),
	}
}

var cmds = []cli.Command{
	{
		Name:        "load",
		Description: "loads a Wasm module to the kernel",
		Alias:       "l",
		FlagSet:     &loadFlags{},
		ExecFunc: func(ctx context.Context, args []string) error {
			if len(args) < 1 {
				log.Fatal("filename required")
			}

			var cfg loadFlags
			if err := cfg.Flags().Parse(args); err != nil {
				return err
			}

			filename := cfg.File
			code, err := os.ReadFile(filename)
			if err != nil {
				return err
			}

			name := cfg.Name
			if name == "" {
				basename := filepath.Base(filename)
				name = strings.TrimSuffix(basename, filepath.Ext(basename))
			}

			c := Command{
				Command:    "load",
				Name:       name,
				Code:       code,
				Entrypoint: cfg.Entrypoint,
			}

			return sendCommand(c)
		},
	},
	{
		Name:        "reset",
		Description: "reset the wasm vm in the kernel",
		Alias:       "r",
		ExecFunc: func(ctx context.Context, args []string) error {
			c := Command{
				Command: "reset",
			}

			return sendCommand(c)
		},
	},
	{
		Name:        "server",
		Description: "run the support server for the kernel module",
		Alias:       "s",
		FlagSet:     &serverFlags{},
		ExecFunc: func(ctx context.Context, args []string) error {
			var cfg serverFlags
			if err := cfg.Flags().Parse(args); err != nil {
				return err
			}

			signerCA, err := tls.NewSignerCA(cfg.CAPemFileName)
			if err != nil {
				return err
			}
			_ = signerCA.Certificate

			commandHandlers["csr_sign"] = CommandHandlerFunc(func(c Command) (string, error) {
				var data struct {
					CSR string `json:"csr"`
				}

				if err := json.Unmarshal([]byte(c.Data), &data); err != nil {
					return "jsonerror", err
				}

				containers, err := tls.ParsePEMs([]byte(data.CSR))
				if err != nil {
					return "error", err
				}

				if len(containers) != 1 {
					return "error", errors.New("invalid csr")
				}

				certificate, err := signerCA.SignCertificateRequest(containers[0].GetX509CertificateRequest().CertificateRequest)
				if err != nil {
					return "error", err
				}

				caCertificate := signerCA.GetCaCertificate()

				var response struct {
					Certificate  *tls.X509Certificate   `json:"certificate"`
					TrustAnchors []*tls.X509Certificate `json:"trust_anchors"`
				}

				response.Certificate = certificate
				response.TrustAnchors = append(response.TrustAnchors, caCertificate)

				j, err := json.Marshal(response)
				if err != nil {
					return "error", err
				}

				return string(j), nil
			})

			dev, err := os.OpenFile("/dev/wasm", os.O_RDWR, 0666)
			if err != nil {
				return err
			}

			defer dev.Close()

			scanner := bufio.NewScanner(dev)

			log.Printf("listening for commands")

			for scanner.Scan() {
				var command Command
				var answer string
				err := json.Unmarshal(scanner.Bytes(), &command)
				if err != nil {
					return err
				}

				log.Printf("received command: (%s) %+v", scanner.Bytes(), command)

				if handler, ok := commandHandlers[command.Command]; ok {
					answer, err = handler.HandleCommand(command)
				} else {
					err = ErrInvalidCommand
				}

				answerObj := Answer{
					ID:      command.ID,
					Command: "answer",
					Answer:  answer,
				}

				if err != nil {
					log.Printf("error answering command: %+v", err)
					answerObj.Error = err.Error()
				}

				answerJson, err := json.Marshal(answerObj)
				if err != nil {
					log.Printf("error marshalling answer: %v", err)
					answerObj.Error = err.Error()
				}

				log.Println("sending answer: ", string(answerJson))

				_, err = dev.Write(append(answerJson, '\n'))
				if err != nil {
					log.Printf("error writing answer: %v", err)
				}
			}

			return nil
		},
	},
}

func sendCommand(c Command) error {
	j, err := json.Marshal(c)
	if err != nil {
		return err
	}

	// append end of string to j
	j = append(j, '\n')

	err = os.WriteFile("/dev/wasm", j, fs.ModeDevice)
	if err != nil {
		return err
	}

	return nil
}

func main() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		os.Exit(0)
	}()

	r := cli.RunnerOf(cmds, cli.Config{
		AppName:        "w3k",
		AppDescription: "cli to control the wasm kernel module",
	})
	if err := r.Run(); err != nil {
		log.Fatal(err)
	}
}

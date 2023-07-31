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
	"io/ioutil"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"

	cli "github.com/cristalhq/acmd"
)

type Command struct {
	ID         []byte `json:"id,omitempty"`
	Command    string `json:"command"`
	Name       string `json:"name"`
	Code       []byte `json:"code"`
	Entrypoint string `json:"entrypoint,omitempty"`
	Error      string `json:"error,omitempty"`
	Answer     string `json:"answer,omitempty"`
}

type Answer struct {
	ID      []byte `json:"id,omitempty"`
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

var ErrInvalidCommand = errors.New("invalid command")

var commandHandlers map[string]CommandHandler

func init() {
	commandHandlers = map[string]CommandHandler{
		"accept": CommandHandlerFunc(AcceptOk),
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
			code, err := ioutil.ReadFile(filename)
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
		ExecFunc: func(ctx context.Context, args []string) error {

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

				log.Printf("received command: %+v", command)

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

	err = ioutil.WriteFile("/dev/wasm", j, fs.ModeDevice)
	if err != nil {
		return err
	}

	return nil
}

func main() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
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

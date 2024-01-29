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

package agent

import (
	"context"
	"encoding/json"
	"io"
	"os"
	"strconv"

	"emperror.dev/errors"
	"github.com/iancoleman/strcase"
	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"sigs.k8s.io/yaml"

	"github.com/cisco-open/camblet/api/v1/agent/trace"
	"github.com/cisco-open/camblet/internal/cli"
)

type traceCommand struct {
	cli  cli.CLI
	opts *traceOptions
}

type traceOptions struct {
	uid         int32
	pid         int32
	commandName string
	output      string
}

func NewTraceCommand(c cli.CLI) *cobra.Command {
	command := &traceCommand{
		cli:  c,
		opts: &traceOptions{},
	}

	cmd := &cobra.Command{
		Use:               "trace-connection",
		Short:             "Trace connections",
		Aliases:           []string{"trace"},
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		Args:              cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if command.opts.commandName == "" && command.opts.pid < 1 && command.opts.uid < 0 {
				return errors.New("--pid, --uid or --command-name must be used")
			}
			return command.run(cmd, args)
		},
	}

	cmd.Flags().Int32Var(&command.opts.pid, "pid", -1, "PID of the process to trace")
	cmd.Flags().Int32Var(&command.opts.uid, "uid", -1, "UID of the user whose commands to trace")
	cmd.Flags().StringVar(&command.opts.commandName, "command-name", "", "Name of the command to trace")
	cmd.Flags().StringVarP(&command.opts.output, "output", "o", "", "Output format (one of 'json', 'yaml')")

	return cmd
}

func (c *traceCommand) run(cmd *cobra.Command, args []string) error {
	grpcConn, err := grpc.Dial(c.cli.Configuration().Agent.LocalAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		panic(err)
	}

	tc := trace.NewTracesClient(grpcConn)

	tr := &trace.TraceRequest{}
	traceParams := map[string]string{}
	if p := c.opts.pid; p >= 1 {
		tr.Pid = uint32(p)
		traceParams["pid"] = strconv.Itoa(int(c.opts.pid))
	}
	if c.opts.uid > 0 {
		uid := uint32(c.opts.uid)
		tr.Uid = &uid
		traceParams["uid"] = strconv.Itoa(int(c.opts.uid))
	}
	if s := c.opts.commandName; s != "" {
		tr.CommandName = s
		traceParams["commandName"] = c.opts.commandName
	}

	stream, err := tc.Trace(context.Background(), tr)
	if err != nil {
		return errors.WrapIf(err, "could not trace")
	}

	c.showTrace(&trace.TraceResponse{
		Message: "tracing started",
		Values:  traceParams,
	})

	for {
		resp, err := stream.Recv()
		if err == io.EOF {
			return nil
		} else if err == nil {
			c.showTrace(resp)
		}

		if err != nil {
			return errors.WrapIf(err, "could not receive from stream")
		}
	}
}

func (c *traceCommand) showTrace(resp *trace.TraceResponse) {
	switch c.opts.output {
	case "":
		c.showLog(resp)
	case "yaml":
		c.showYAML(resp)
	case "json":
		c.showJSON(resp)
	}
}

func (c *traceCommand) getJSON(resp *trace.TraceResponse) []byte {
	var output []byte
	if c.cli.Interactive() {
		output, _ = json.MarshalIndent(resp, "", "  ")
	} else {
		output, _ = json.Marshal(resp)
	}

	return output
}

func (c *traceCommand) showJSON(resp *trace.TraceResponse) {
	os.Stdout.Write(append(c.getJSON(resp), []byte("\n")...))
}

func (c *traceCommand) showYAML(resp *trace.TraceResponse) {
	output, _ := yaml.JSONToYAML(c.getJSON(resp))
	os.Stdout.Write(append(output, []byte("\n")...))
}

func (c *traceCommand) showLog(resp *trace.TraceResponse) {
	var params []any

	if resp.Context != nil {
		params = []any{
			"ctx.commandName", resp.Context.CommandName,
			"ctx.commandPath", resp.Context.CommandPath,
			"ctx.uid", resp.Context.Uid,
			"ctx.gid", resp.Context.Gid,
		}
	}

	id := ""

	for k, v := range resp.GetValues() {
		if k == "id" {
			id = v
			continue
		}
		params = append(params, strcase.ToLowerCamel(k), v)
	}

	c.cli.Logger().WithName(id).Info(resp.Message, params...)
}

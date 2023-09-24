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
	"github.com/spf13/cobra"

	"github.com/cisco-open/nasp/internal/cli"
	"github.com/cisco-open/nasp/internal/cli/cmd/agent/wasm"
	"github.com/cisco-open/nasp/pkg/agent/commands"
	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/agent/server"
)

func NewCommand(c cli.CLI) *cobra.Command {
	cmd := &cobra.Command{
		Use:               "agent",
		Short:             "Nasp agent",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		RunE: func(cmd *cobra.Command, params []string) error {
			h, err := commands.NewHandler(c.EventBus())
			if err != nil {
				return err
			}
			if err := h.Run(cmd.Context()); err != nil {
				return err
			}

			errChan := make(chan error)
			go func() {
				errChan <- messenger.New(c.EventBus()).Run(cmd.Context(), c.Configuration().Agent.KernelModuleDevice)
			}()
			go func() {
				errChan <- server.New(c.Configuration().Agent).ListenAndServe(cmd.Context())
			}()

			select {
			case err := <-errChan:
				c.Logger().Error(err, "agent stopped prematurely")
				return err
			case <-cmd.Context().Done():
				c.Logger().Info("stopping agent")
				<-errChan
				c.Logger().Info("agent have stopped")

				return nil
			}
		},
	}

	cmd.Flags().String("local-address", "/tmp/nasp/agent.sock", "Local address")
	cmd.Flags().String("kernel-module-device", "/dev/wasm", "Device for the Nasp kernel module")

	cli.BindCMDFlags(c.Viper(), cmd)

	cmd.AddCommand(wasm.NewCommand(c))

	return cmd
}

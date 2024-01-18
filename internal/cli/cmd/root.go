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

package cmd

import (
	"fmt"
	"os"

	"emperror.dev/errors"
	"github.com/iand/logfmtr"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"

	"github.com/cisco-open/camblet/internal/cli"
	"github.com/cisco-open/camblet/internal/cli/cmd/agent"
	"github.com/cisco-open/camblet/internal/cli/cmd/ca"
	"github.com/cisco-open/camblet/pkg/config"
)

func NewRootCommand(c cli.CLI) *cobra.Command {
	cmd := &cobra.Command{
		Use:               "camblet <command> <subcommand> [flags]",
		Short:             "Camblet manages PKI for workloads running on Linux anywhere",
		SilenceErrors:     false,
		SilenceUsage:      false,
		DisableAutoGenTag: true,
		Version:           c.BuildInfo().Version,
	}
	cmd.SetVersionTemplate(c.Name() + " " + c.BuildInfo().String())

	v := c.Viper()

	cmd.AddCommand(agent.NewCommand(c))
	cmd.AddCommand(ca.NewCommand(c))

	flags := cmd.PersistentFlags()

	flags.String("config", "", "Configuration file")
	flags.Int32P("verbosity", "v", 0, "info log verbosity, higher value produces more output")
	flags.Bool("version", false, "Show version information")

	flags.Bool("no-color", false, "never use color even when in a terminal")
	flags.Bool("force-color", false, "force color even when non in a terminal")
	flags.Bool("non-interactive", false, "never ask questions interactively")
	flags.Bool("force-interactive", false, "ask questions interactively even if stdin or stdout is non-tty")

	if c.BuildInfo().Version == "dev" {
		flags.Bool("dump-viper-settings", false, "Dump all viper settings")
		flags.Bool("dump-config", false, "Dump configuration")
	}

	_ = v.BindPFlags(flags)

	cmd.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {

		if v := v.GetInt32("verbosity"); v >= 0 {
			logfmtr.SetVerbosity(int(v))
		}

		if c := v.GetString("config"); c != "" {
			v.SetConfigFile(c)
		}

		c.SetConfiguration(config.Configure(v, flags))

		if v.GetBool("dump-viper-settings") {
			if y, err := yaml.Marshal(v.AllSettings()); err != nil {
				panic(errors.WrapIf(err, "failed to dump viper settings"))
			} else {
				fmt.Print(string(y))
			}

			os.Exit(0)
		}

		if v.GetBool("dump-config") {
			fmt.Print(c.Configuration().Dump())

			os.Exit(0)
		}

		return nil
	}

	return cmd
}

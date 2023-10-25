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

package attest

import (
	"fmt"
	"strconv"

	"github.com/go-logr/logr"
	"github.com/spf13/cobra"

	"github.com/cisco-open/nasp/internal/cli"
	"github.com/cisco-open/nasp/pkg/config"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/docker"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/k8s"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/linux"
	"github.com/cisco-open/nasp/pkg/util"
)

func NewAttestCommand(c cli.CLI) *cobra.Command {
	cmd := &cobra.Command{
		Use:               "attest [pid]",
		Short:             "attest workload by pid",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		Args:              cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			attestor := GetWorkloadAttestor(c.Configuration(), c.Logger())

			pid, err := strconv.Atoi(args[0])
			if err != nil {
				return err
			}

			tags, err := attestor.Attest(cmd.Context(), int32(pid))
			if err != nil {
				return err
			}

			for _, tag := range tags.GetEntries() {
				selector := fmt.Sprintf("%s:%s", tag.Key, tag.Value)
				fmt.Println(selector)
			}

			return err
		},
	}

	return cmd
}

func GetWorkloadAttestor(cfg config.Config, logger logr.Logger) workloadattestor.WorkloadAttestors {
	attestor := workloadattestor.NewWorkloadAttestors(logger)

	attestorsConfig := cfg.Agent.WorkloadAttestors

	if util.PointerToBool(attestorsConfig.Linux.Enabled) {
		attestor.Add(linux.New(attestorsConfig.Linux.Config))
	}

	if util.PointerToBool(attestorsConfig.Docker.Enabled) {
		attestor.Add(docker.New(attestorsConfig.Docker.Config))
	}

	if util.PointerToBool(attestorsConfig.K8s.Enabled) {
		attestor.Add(k8s.New(attestorsConfig.K8s.Config))
	}

	return attestor
}

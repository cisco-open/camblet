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
	"fmt"
	"strconv"

	"emperror.dev/errors"
	"github.com/spf13/cobra"

	"github.com/gezacorp/metadatax"

	"github.com/cisco-open/camblet/internal/cli"
	"github.com/cisco-open/camblet/pkg/config/metadata/collectors"
)

func NewAugmentCommand(c cli.CLI) *cobra.Command {
	cmd := &cobra.Command{
		Use:               "augment [pid]",
		Short:             "augment process information",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		Args:              cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			collector := collectors.GetMetadataCollector(c.Configuration().Agent.MetadataCollectors, c.Logger())

			pid, err := strconv.Atoi(args[0])
			if err != nil {
				return err
			}

			md, err := collector.GetMetadata(metadatax.ContextWithPID(cmd.Context(), int32(pid)))
			if err != nil {
				for _, e := range errors.GetErrors(err) {
					c.Logger().V(1).Info("error during metadata collection", "error", e)
				}
				err = nil
			}

			for _, label := range md.GetLabelsSlice() {
				fmt.Println(label.Name + ":" + label.Value)
			}

			return err
		},
	}

	return cmd
}

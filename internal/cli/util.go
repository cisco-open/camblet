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

package cli

import (
	"strings"

	"github.com/iancoleman/strcase"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
)

// BindCMDFlags binds cobra command flags with {cmd name}.{camelized flag name} format to viper
// it also binds {cmd name}- prefixed flags with similar fashion
func BindCMDFlags(v *viper.Viper, cmd *cobra.Command) {
	getKey := func(cmdName, flagName string, prefixSeparator, trimSeparator string) string {
		return cmdName + prefixSeparator + camelize(strings.TrimPrefix(flagName, cmdName+trimSeparator))
	}

	cmd.Flags().VisitAll(func(flag *pflag.Flag) {
		key := getKey(cmd.Name(), flag.Name, ".", ".")
		if err := v.BindPFlag(key, flag); err != nil {
			return
		}
		if strings.HasPrefix(flag.Name, cmd.Name()+"-") {
			key = getKey(cmd.Name(), flag.Name, ".", "-")
			if err := v.BindPFlag(key, flag); err != nil {
				return
			}
		}
	})

	cmd.PersistentFlags().VisitAll(func(flag *pflag.Flag) {
		key := getKey(cmd.Name(), flag.Name, ".", ".")
		if err := v.BindPFlag(key, flag); err != nil {
			return
		}
		if strings.HasPrefix(flag.Name, cmd.Name()+"-") {
			key = getKey(cmd.Name(), flag.Name, ".", "-")
			if err := v.BindPFlag(key, flag); err != nil {
				return
			}
		}
	})
}

func camelize(str string) string {
	parts := make([]string, 0)
	for _, p := range strings.Split(str, ".") {
		parts = append(parts, strcase.ToLowerCamel(p))
	}

	return strings.Join(parts, ".")
}

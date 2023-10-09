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

package config

import (
	"reflect"
	"strings"

	"emperror.dev/errors"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
)

func Configure(v *viper.Viper, flags *pflag.FlagSet) Config {
	setupViper(v, flags)

	err := v.ReadInConfig()
	if _, ok := err.(viper.ConfigFileNotFoundError); err != nil && !ok {
		panic(errors.WrapIf(err, "failed to read configuration"))
	}

	var configuration Config

	bindEnvs(v, configuration)

	err = v.Unmarshal(&configuration)
	if err != nil {
		panic(errors.WrapIf(err, "failed to unmarshal configuration"))
	}

	configuration, err = configuration.Validate()
	if err != nil {
		panic(errors.WrapIf(err, "cloud not validate configuration"))
	}

	return configuration
}

// setupViper configures some defaults in the Viper instance
func setupViper(v *viper.Viper, p *pflag.FlagSet) {
	v.AddConfigPath(".")
	v.AddConfigPath("./config")

	v.BindPFlags(p) // nolint:errcheck

	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AllowEmptyEnv(true)
	v.AutomaticEnv()
}

func bindEnvs(vip *viper.Viper, iface interface{}, parts ...string) {
	ifv := reflect.ValueOf(iface)
	ift := reflect.TypeOf(iface)
	for i := 0; i < ift.NumField(); i++ {
		v := ifv.Field(i)
		t := ift.Field(i)
		tv, ok := t.Tag.Lookup("json")
		if !ok {
			continue
		}
		tv, _, _ = strings.Cut(tv, ",")
		switch v.Kind() {
		case reflect.Struct:
			_parts := parts
			if tv != "" {
				_parts = append(_parts, tv)
			}
			bindEnvs(vip, v.Interface(), _parts...)
		default:
			err := vip.BindEnv(strings.Join(append(parts, tv), "."))
			if err != nil {
				panic(errors.WrapIf(err, "could not bind env variable"))
			}
		}
	}
}

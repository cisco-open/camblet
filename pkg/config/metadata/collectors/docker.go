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

package collectors

import (
	"emperror.dev/errors"

	"github.com/gezacorp/metadatax"
	"github.com/gezacorp/metadatax/collectors/docker"
)

const (
	defaultDockerSocketPath = "unix:///var/run/docker.sock"
)

type DockerCollectorConfig struct {
	BaseConfig `json:",inline" mapstructure:",squash"`

	SocketPath string `json:"socketPath,omitempty"`
}

func (c *DockerCollectorConfig) Validate() error {
	if !c.IsEnabled() {
		return nil
	}

	if c.SocketPath == "" {
		c.SocketPath = defaultDockerSocketPath
	}

	return nil
}

func (c DockerCollectorConfig) Instantiate() (metadatax.Collector, error) {
	if !c.IsEnabled() {
		return nil, errors.WithStack(DisabledCollectorError)
	}

	opts := make([]docker.CollectorOption, 0)

	opts = append(opts, docker.WithSocketPath(c.SocketPath))

	return docker.New(opts...)
}

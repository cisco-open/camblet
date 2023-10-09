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
	"encoding/json"

	"gopkg.in/yaml.v3"
)

// Config holds any kind of configuration that comes from the outside world and
// is necessary for running the application
type Config struct {
	Agent Agent `json:"agent,omitemtpy"`
}

// Validate validates the configuration
func (c Config) Validate() (Config, error) {
	var err error

	c.Agent, err = c.Agent.Validate()
	if err != nil {
		return c, nil
	}

	return c, nil
}

func (c Config) Dump() string {
	j, err := json.Marshal(c)
	if err != nil {
		return ""
	}

	var values map[string]interface{}
	if err := json.Unmarshal(j, &values); err != nil {
		return ""
	}

	y, err := yaml.Marshal(values)
	if err != nil {
		return ""
	}

	return string(y)
}

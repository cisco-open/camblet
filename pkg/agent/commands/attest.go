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

package commands

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
)

type attestCommand struct {
	attestor workloadattestor.WorkloadAttestors
}

func Attest(attestor workloadattestor.WorkloadAttestors) CommandHandler {
	return &attestCommand{
		attestor: attestor,
	}
}

func (c *attestCommand) HandleCommand(cmd messenger.Command) (string, error) {
	var data struct {
		SourceIP        string `json:"source_ip,omitempty"`
		SourcePort      int32  `json:"source_port,omitempty"`
		DestinationIP   string `json:"destination_ip,omitempty"`
		DestinationPort int32  `json:"destination_port,omitempty"`
	}

	if err := json.Unmarshal([]byte(cmd.Data), &data); err != nil {
		return "error", err
	}

	tags, err := c.attestor.Attest(context.Background(), int32(cmd.Context.PID))
	if err != nil {
		return "error", err
	}

	var response struct {
		Selectors map[string]bool `json:"selectors"`
	}

	response.Selectors = make(map[string]bool)

	response.Selectors[fmt.Sprintf("source:ip:%s", data.SourceIP)] = true
	response.Selectors[fmt.Sprintf("source:port:%d", data.SourcePort)] = true
	response.Selectors[fmt.Sprintf("destination:ip:%s", data.DestinationIP)] = true
	response.Selectors[fmt.Sprintf("destination:port:%d", data.DestinationPort)] = true

	for _, v := range tags.Entries {
		response.Selectors[fmt.Sprintf("%s:%s", v.Key, v.Value)] = true
	}

	j, err := json.Marshal(response)
	if err != nil {
		return "error", err
	}

	return string(j), nil
}

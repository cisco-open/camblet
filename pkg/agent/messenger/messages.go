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

package messenger

import (
	"encoding/json"

	trace_v1_api "github.com/cisco-open/camblet/api/v1/agent/trace"
)

type MessageType string

type Message struct {
	Type MessageType `json:"type"`
	Data []byte      `json:"data"`
}

func (m *Message) SetData(v any) error {
	j, err := json.Marshal(v)
	if err != nil {
		return err
	}

	m.Data = j

	return nil
}

func (m Message) Unmarshal(v any) error {
	return json.Unmarshal(m.Data, v)
}

type TraceRequestAction string

const (
	AddTraceRequestAction      TraceRequestAction = "add"
	RemoveTraceRequestAction   TraceRequestAction = "remove"
	ClearAllTraceRequestAction TraceRequestAction = "clear_all"
)

type TraceRequestMessage struct {
	*trace_v1_api.TraceRequest `json:",inline"`
	Action                     TraceRequestAction `json:"action"`
}

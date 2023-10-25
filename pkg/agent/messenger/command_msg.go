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

import "emperror.dev/errors"

const CommandMessageType MessageType = "command"

func NewCommand(cmd Command) Message {
	m := &Message{
		Type: CommandMessageType,
	}

	_ = m.SetData(cmd)

	return *m
}

func GetCommand(msg Message) (Command, error) {
	var cmd Command
	if msg.Type != CommandMessageType {
		return cmd, errors.New("invalid message type")
	}

	if err := msg.Unmarshal(&cmd); err != nil {
		return cmd, err
	}

	return cmd, nil
}

type CommandContext struct {
	UID          int          `json:"uid,omitempty"`
	GID          int          `json:"gid,omitempty"`
	PID          int          `json:"pid,omitempty"`
	CommandName  string       `json:"command_name,omitempty"`
	CommandPath  string       `json:"command_path,omitempty"`
	NamespaceIDs NamespaceIDs `json:"namespace_ids,omitempty"`
}

type NamespaceIDs struct {
	UTS     int64 `json:"uts,omitempty"`
	IPC     int64 `json:"ipc,omitempty"`
	Mount   int64 `json:"mount,omitempty"`
	PID     int64 `json:"pid,omitempty"`
	Network int64 `json:"network,omitempty"`
	Time    int64 `json:"time,omitempty"`
	CGroup  int64 `json:"cGroup,omitempty"`
}

type Command struct {
	Context    CommandContext `json:"task_context,omitempty"`
	ID         string         `json:"id,omitempty"`
	Command    string         `json:"command"`
	Name       string         `json:"name,omitempty"`
	Code       []byte         `json:"code,omitempty"`
	Entrypoint string         `json:"entrypoint,omitempty"`
	Data       string         `json:"data,omitempty"`
}

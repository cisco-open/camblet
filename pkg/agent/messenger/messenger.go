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
	"bufio"
	"context"
	"encoding/json"
	"os"

	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"
)

type messenger struct {
	dev *os.File

	eventBus *eventbus.EventBus
	logger   logr.Logger
}

const (
	MessageIncomingTopic  string = "message.incoming"
	MessageOutgoingTopic  string = "message.outgoing"
	MessengerStartedTopic string = "messenger.started"
)

func New(eventBus *eventbus.EventBus, logger logr.Logger) *messenger {
	m := &messenger{
		eventBus: eventBus,
		logger:   logger,
	}

	return m
}

func (m *messenger) Run(ctx context.Context, name string) error {
	m.logger.Info("starting kernel device message handler")

	if err := m.eventBus.Subscribe(MessageOutgoingTopic, func(topic string, msg Message) {
		if m.dev != nil {
			if _, err := m.dev.Write(append(msg.Data, '\n')); err != nil {
				m.logger.Error(err, "could not write command reply")
			}
		}
	}); err != nil {
		return err
	}

	var err error
	m.dev, err = os.OpenFile(name, os.O_RDWR, 0666)
	if err != nil {
		return err
	}
	defer func() {
		m.dev.Close()
		m.dev = nil
	}()

	if err := m.eventBus.Publish(MessengerStartedTopic, true); err != nil {
		return err
	}

	scanner := bufio.NewScanner(m.dev)
	for scanner.Scan() {
		var command Command
		err := json.Unmarshal(scanner.Bytes(), &command)
		if err != nil {
			return err
		}

		err = m.eventBus.Publish(MessageIncomingTopic, Message{
			Type: CommandMessageType,
			Data: append([]byte{}, scanner.Bytes()...),
		})
		if err != nil {
			return err
		}
	}

	return nil
}

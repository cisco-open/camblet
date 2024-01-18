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
	"log"
	"sync"

	"emperror.dev/errors"
	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"

	"github.com/cisco-open/camblet/pkg/agent/messenger"
)

type CommandHandler interface {
	HandleCommand(c messenger.Command) (string, error)
}

type Commander interface {
	Run(ctx context.Context) error
	AddHandler(commandName string, handler CommandHandler)
}

type CommandHandlerFunc func(messenger.Command) (string, error)

func (f CommandHandlerFunc) HandleCommand(c messenger.Command) (string, error) {
	return f(c)
}

type handler struct {
	eventBus *eventbus.EventBus
	logger   logr.Logger

	handlers    sync.Map
	handlersMux sync.Mutex
}

func NewHandler(eventBus *eventbus.EventBus, logger logr.Logger) (Commander, error) {
	h := &handler{
		eventBus: eventBus,
		logger:   logger,

		handlers: sync.Map{},
	}

	return h, nil
}

func (h *handler) Run(ctx context.Context) error {
	return h.eventBus.Subscribe(messenger.MessageIncomingTopic, h.handleCommand)
}

func (h *handler) AddHandler(commandName string, handler CommandHandler) {
	h.handlers.Store(commandName, handler)
}

func (h *handler) handleCommand(topic string, msg messenger.Message) {
	cmd, err := messenger.GetCommand(msg)
	if err != nil {
		h.logger.Error(err, "could not get command from incoming message")
		return
	}

	h.logger.Info("incoming command", "type", cmd.Command, "id", cmd.ID, "context", cmd.Context)

	var handler CommandHandler
	if v, ok := h.handlers.Load(cmd.Command); ok {
		if h, ok := v.(CommandHandler); ok {
			handler = h
		}
	}

	var answer string
	if handler != nil {
		answer, err = handler.HandleCommand(cmd)
	} else {
		err = errors.New("invalid command")
	}

	answerObj := messenger.Answer{
		ID:      cmd.ID,
		Command: "answer",
		Answer:  answer,
	}

	if err != nil {
		h.logger.Error(err, "error during command handling", "id", cmd.ID)
		answerObj.Error = err.Error()
	}

	answerJson, err := json.Marshal(answerObj)
	if err != nil {
		log.Printf("error marshalling answer: %v", err)
		return
	}

	h.logger.Info("sending command response", "type", cmd.Command, "id", cmd.ID)

	if err := h.eventBus.Publish(messenger.MessageOutgoingTopic, messenger.Message{
		Type: messenger.AnswerMessageType,
		Data: answerJson,
	}); err != nil {
		h.logger.Error(err, "could not publish response message", "type", cmd.Command, "id", cmd.ID)
	}
}

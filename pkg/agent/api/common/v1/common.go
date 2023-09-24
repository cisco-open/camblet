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

package v1

import (
	"context"

	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/werbenhu/eventbus"

	commonv1 "github.com/cisco-open/nasp/api/agent/common/v1"
	"github.com/cisco-open/nasp/pkg/agent/messenger"
)

type Service struct {
	commonv1.UnimplementedCommonServer

	eventBus *eventbus.EventBus
}

func New(eventBus *eventbus.EventBus) *Service {
	return &Service{
		eventBus: eventBus,
	}
}

func (s *Service) ResetWASM(context.Context, *emptypb.Empty) (*emptypb.Empty, error) {
	msg := messenger.NewCommand(messenger.Command{
		Command: "reset",
	})

	s.eventBus.Publish(messenger.MessageOutgoingTopic, msg)

	return &emptypb.Empty{}, nil
}

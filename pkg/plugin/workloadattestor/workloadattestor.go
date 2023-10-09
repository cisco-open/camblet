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

package workloadattestor

import (
	"context"
	"sync"

	"github.com/go-logr/logr"
	"github.com/google/uuid"

	"github.com/cisco-open/nasp/api/types"
	"github.com/cisco-open/nasp/pkg/plugin"
)

type WorkloadAttestor interface {
	plugin.Common

	Attest(ctx context.Context, pid int32) (*types.Tags, error)
}

type WorkloadAttestors interface {
	List() []WorkloadAttestor
	Add(WorkloadAttestor)
	Clear()

	Attest(ctx context.Context, pid int32) (*types.Tags, error)
}

type workloadAttestors struct {
	logger  logr.Logger
	entries sync.Map
}

func NewWorkloadAttestors(logger logr.Logger) WorkloadAttestors {
	return &workloadAttestors{
		logger:  logger,
		entries: sync.Map{},
	}
}

func (w *workloadAttestors) Attest(ctx context.Context, pid int32) (*types.Tags, error) {
	tags := &types.Tags{
		Entries: []*types.Tag{},
	}

	w.entries.Range(func(_, v any) bool {
		if v, ok := v.(WorkloadAttestor); ok {
			t, err := v.Attest(ctx, pid)
			if err != nil {
				w.logger.Error(err, "could not attest", "attestor", v.Name())
				return true
			}

			for _, e := range t.GetEntries() {
				tags.Entries = append(tags.Entries, e)
			}
		}

		return true
	})

	return tags, nil
}

func (w *workloadAttestors) List() (list []WorkloadAttestor) {
	w.entries.Range(func(_, v any) bool {
		list = append(list, v.(WorkloadAttestor))
		return true
	})

	return
}

func (w *workloadAttestors) Add(attestor WorkloadAttestor) {
	w.entries.Store(uuid.New().String(), attestor)
}

func (w *workloadAttestors) Clear() {
	w.entries = sync.Map{}
}

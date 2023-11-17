// Copyright The SPIFFE Project & Scytale, Inc

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// 	http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package server

import (
	"fmt"
	"net"
	"os"
	"path/filepath"

	"emperror.dev/errors"
)

func prepareLocalAddr(localAddr net.Addr) error {
	if err := os.MkdirAll(filepath.Dir(localAddr.String()), 0750); err != nil {
		return fmt.Errorf("unable to create socket directory: %w", err)
	}

	return nil
}

func getUnixAddr(path string) (*net.UnixAddr, error) {
	pathAbs, err := filepath.Abs(path)
	if err != nil {
		return nil, errors.WrapIf(err, "could not get absolute socket path")
	}

	return &net.UnixAddr{
		Name: pathAbs,
		Net:  "unix",
	}, nil
}

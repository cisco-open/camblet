// Copyright The SPIFFE Project & Scytale, Inc
// Copyright (c) 2023 Cisco and its affiliates. All rights reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// 	http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package linux

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strconv"

	"emperror.dev/errors"
)

func GetProcPath(pID int32, lastPath string) string {
	procPath := os.Getenv("HOST_PROC")

	if procPath == "" {
		procPath = defaultProcPath
	}

	return filepath.Join(procPath, strconv.FormatInt(int64(pID), 10), lastPath)
}

func GetSHA256Digest(path string, limit int64) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", errors.WithStack(err)
	}
	defer f.Close()

	if limit > 0 {
		fi, err := f.Stat()
		if err != nil {
			return "", errors.WithStack(err)
		}
		if fi.Size() > limit {
			return "", errors.WrapIf(err, "content exceeds size limit")
		}
	}

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", errors.WithStack(err)
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}

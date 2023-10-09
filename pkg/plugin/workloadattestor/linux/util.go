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

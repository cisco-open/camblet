package util

func BoolPointer(b bool) *bool {
	return &b
}

func PointerToBool(b *bool) bool {
	if b == nil {
		return false
	}

	return *b
}

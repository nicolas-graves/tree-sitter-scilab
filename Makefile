PREFIX :=

.PHONY: check

check:
	$(PREFIX) tree-sitter generate
	$(PREFIX) tree-sitter test

(use-modules
 (guix build-system tree-sitter)
 (guix gexp)
 (guix git-download)
 ((guix licenses) #:prefix license:)
 (guix packages)
 (gnu packages commencement)
 (gnu packages node)
 (gnu packages python)
 (gnu packages python-xyz)
 (gnu packages rust)
 (gnu packages tree-sitter)
 (guix utils)
 (guix git)
 (git))

;; XXX: copied from tree-sitter.scm.
(define (tree-sitter-delete-generated-files grammar-directories)
  #~(begin
      (use-modules (guix build utils))
      (delete-file "binding.gyp")
      (delete-file-recursively "bindings")
      (for-each
       (lambda (lang)
         (with-directory-excursion lang
           (delete-file "src/grammar.json")
           (delete-file "src/node-types.json")
           (delete-file "src/parser.c")
           (delete-file-recursively "src/tree_sitter")))
       '#$grammar-directories)))

;; XXX: Copied from tree-sitter.scm
(define* (tree-sitter-grammar
          name text version
          #:key
          (hash #f)
          (commit (string-append "v" version))
          (grammar-directories '("."))
          (source (origin
                   (method git-fetch)
                   (uri
                    (git-reference
                     (url
                      (format #f "https://github.com/tree-sitter/tree-sitter-~a" name))
                     (commit commit)))
                   (file-name (git-file-name name version))
                   (sha256 (base32 hash))
                   (snippet
                    (get-cleanup-snippet grammar-directories))))
          (repository-url (and=> git-reference-url
                                 (and=> origin-uri source)))
          (article "a")
          (inputs '())
          (get-cleanup-snippet tree-sitter-delete-generated-files)
          (license license:expat))
  "Returns a package for Tree-sitter grammar.  NAME will be used with
tree-sitter- prefix to generate package name and also for generating
REPOSITORY-URL value if it's not specified explicitly, TEXT is a string which
will be used in description and synopsis. GET-CLEANUP-SNIPPET is a function,
it recieves GRAMMAR-DIRECTORIES as an argument and should return a G-exp,
which will be used as a snippet in origin."
  (let* ((multiple? (> (length grammar-directories) 1))
         (grammar-names (string-append text " grammar" (if multiple? "s" "")))
         (synopsis (string-append "Tree-sitter " grammar-names))
         (description
          (string-append "This package provides "
                         (if multiple? "" article) (if multiple? "" " ")
                         grammar-names " for the Tree-sitter library."))
         (name (string-append "tree-sitter-" name)))
    (package
      (name name)
      (version version)
      (home-page repository-url)
      (source source)
      (build-system tree-sitter-build-system)
      (arguments (list #:grammar-directories grammar-directories
                       #:tests? #f)) ;; This line is changed.
      (inputs inputs)
      (synopsis synopsis)
      (description description)
      (license license))))

(define-public tree-sitter-scilab
  (let* ((repository (repository-open (getcwd)))
         (revision "0")
         (commit (oid->string
                  (object-id
                   (revparse-single repository "main")))))
    (tree-sitter-grammar
     "scilab" "Scilab"
     (git-version "1.0.2" revision commit)
     #:source (git-checkout (url (getcwd)) (commit commit))
     #:repository-url "https://git.sr.ht/~ngraves/tree-sitter-scilab"
     #:license license:expat)))

(packages->manifest
 (list
  coreutils
  python-wrapper
  ;; recommended development dependencies
  python-flake8
  ;; tree-sitter-related
  rust
  tree-sitter-cli
  node
  gcc-toolchain-13
  python-tree-sitter))

;;; package --- scilab-ts-mode
;;; Commentary:
;;; SPDX-License-Identifier: GPL-3.0-or-later
;;; Copyright © 2024 Nicolas Graves <ngraves@ngraves.fr>
;;; This is a basic (unpolished) ts-mode inspired by
;;; https://www.masteringemacs.org/article/lets-write-a-treesitter-major-mode
;;; Code:

(require 'text-mode)
(require 'treesit)

;; (defvar scilab-ts-constants
;;   '("SCI" "WSCI" "SCIHOME" "TMPDIR" "home"
;;     "%chars" "%e" "%eps" "%i" "%inf" "%nan" "%pi" "%s" "%z"))

(defvar scilab-ts-operators
  '("+" "-" "*" ".*" ".*." "*." "/" "./" "./." "/." "\\" ".\\" ".\\."
  "\\." "^" ".^" "'" ".'" "|" "&" "<" "<=" ">" ">=" "==" "~=" "<>" "="
  "&&" "||" ":" "~"))

(defvar scilab-ts-font-lock-rules
  (list
   :feature 'error
   :language 'scilab
   '((ERROR) @font-lock-warning-face)

   :feature 'constant
   :language 'scilab
   `(;(ignored_argument) @font-lock-builtin-face
     [ (boolean) (constant) ] @font-lock-constant-face)

   :feature 'struct
   :language 'scilab
   '((struct "." @font-lock-operator-face)
     ;; (struct . [(function_call
                 ;; name: (identifier) @font-lock-variable-use-face)
                ;; (identifier) @font-lock-variable-use-face])
     (struct
      [(function_call
        name: (identifier) @font-lock-property-use-name)
       (identifier) @font-lock-property-use-name]))

   :feature 'function_definition
   :language 'scilab
   '((function_definition "function" @font-lock-keyword-face)
     (function_definition name: (identifier) @font-lock-function-name-face)
     (function_definition ["end" "endfunction"] @font-lock-keyword-face)
     (return_statement) @font-lock-keyword-face)

   :feature 'function_call
   :language 'scilab
   '((function_call)
     name: (identifier) @font-lock-function-call-face)

   :feature 'argument
   :language 'scilab
   '((arguments) (identifier) @font-lock-variable-use-face)

   :feature 'conditional
   :language 'scilab
   '((if_statement) [ "if" "end" ] @font-lock-keyword-face
     (elseif_clause "elseif" @font-lock-keyword-face)
     (else_clause "else" @font-lock-keyword-face)
     (select_statement [ "select" "end" ] @font-lock-keyword-face)
     (case_clause "case" @font-lock-keyword-face)
     (break_statement) @font-lock-keyword-face)

   :feature 'repeat
   :language 'scilab
   '((for_statement [ "for" "end" ] @font-lock-keyword-face)
     (while_statement [ "while" "end" ] @font-lock-keyword-face)
     (continue_statement) @font-lock-keyword-face)

   :feature 'exception
   :language 'scilab
   '((try_statement [ "try" "end" ] @font-lock-keyword-face)
     (catch_clause "catch" @font-lock-keyword-face))

   :feature 'delimiter
   :language 'scilab
   '([ ";" "," "." ] @font-lock-delimiter-face)

   :feature 'bracket
   :language 'scilab
   '([ "(" ")" "[" "]" "{" "}" ] @font-lock-bracket-face)

   :feature 'string
   :language 'scilab
   '((string) @font-lock-string-face
    (string (special_escape_sequence) @font-lock-escape-face)
    (formatting_sequence) @font-lock-escape-face)

   :feature 'number
   :language 'scilab
   '((number) @font-lock-number-face)

   :feature 'comment
   :language 'scilab
   '([ (comment) (line_continuation) ] @font-lock-comment-face)

   :feature 'operator
   :language 'scilab
   `([,@scilab-ts-operators] @font-lock-operator-face
     (unary_operator ["+" "-"] @font-lock-number-face))

   :feature 'assignment
   :language 'scilab
   '((assignment left: (_) @font-lock-variable-use-face)
     (multioutput_variable (_) @font-lock-variable-use-face))))

(define-derived-mode scilab-ts-mode text-mode "Scilab[ts]"
  "Major mode for editing Scilab with tree-sitter."

  (setq-local font-lock-defaults nil)
  (when (treesit-ready-p 'scilab)
    (treesit-parser-create 'scilab)
    (scilab-ts-setup)))

(defun scilab-ts-setup ()
  "Setup treesit for `scilab-ts-mode'."

  (setq-local treesit-font-lock-settings
              (apply #'treesit-font-lock-rules
                     scilab-ts-font-lock-rules))

  ;; This handles indentation -- again, more on that below.
  ;; (setq-local treesit-simple-indent-rules scilab-ts-indent-rules)

  ;; ... everything else we talk about go here also ...
  (setq-local
   treesit-font-lock-feature-list
   '((comment error function_definition)
     (string struct)
     (assignment function_call argument constant number)
     (bracket conditional delimiter exception operator repeat)))

  (treesit-major-mode-setup))

(provide 'scilab-ts-mode)
;;; scilab-ts-mode.el ends here

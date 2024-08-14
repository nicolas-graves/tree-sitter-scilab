; attribute
; comment
; constant
; constant.builtin
; constructor
; doc
; embedded
; escape
; function
; function.builtin
; function.call
; function.macro
; function.special
; keyword
; label
; method
; method.call
; number
; operator
; property
; property.definition
; punctuation
; punctuation.bracket
; punctuation.delimiter
; punctuation.special
; string
; string.special
; tag
; variable
; variable.builtin
; variable.parameter
; variable.special

; Errors

(ERROR) @error

; Constants

"_" @constant.builtin

; Fields/Properties

(struct "." @operator)
(struct . [(function_call
             name: (identifier) @variable)
           (identifier) @variable])
(struct
  [(function_call
     name: (identifier) @field)
   (identifier) @field])

; Functions

(function_definition
  "function" @keyword
  name: (identifier) @function
  [ "end" "endfunction" ]? @keyword)

(function_call name: (identifier) @function.call)

(return_statement) @keyword

; Parameters

(arguments (identifier) @variable.parameter)

; Conditionals

(if_statement [ "if" "end" ] @keyword)
(elseif_clause "elseif" @keyword)
(else_clause "else" @keyword)
(select_statement [ "select" "end" ] @keyword)
(case_clause "case" @keyword)
(break_statement) @keyword

; Repeats

(for_statement [ "for" "end" ] @keyword)
(while_statement [ "while" "do" "then" "end" ] @keyword)
(continue_statement) @keyword

; Exceptions

(try_statement [ "try" "end" ] @keyword)
(catch_clause "catch" @keyword)

; Punctuation

[ ";" "," "." ] @punctuation.delimiter
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket

; Literals

(special_escape_sequence) @escape
(formatting_sequence) @escape
(string) @string
(number) @number
(boolean) @constant.builtin

; Comments

[ (comment) (line_continuation) ] @comment @spell

; Operators

(unary_operator ["+" "-"] @number)

[
  "+"
  "-"
  "*"
  ".*"
  ".*."
  "*."
  "/"
  "./"
  "./."
  "/."
  "\\"
  ".\\"
  ".\\."
  "\\."
  "^"
  ".^"
  "'"
  ".'"
  "|"
  "&"
  "<"
  "<="
  ">"
  ">="
  "=="
  "~="
  "="
  "&&"
  "||"
  ":"
  "~"
] @operator

; Assignments

(assignment left: (_) @variable)
(multioutput_variable (_) @variable)

; Keywords

[
  "end"
] @keyword

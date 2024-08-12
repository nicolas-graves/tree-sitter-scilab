; Keywords

[
  "end"
  "global"
] @keyword

; Conditionals

(if_statement [ "if" "end" ] @conditional)
(elseif_clause "elseif" @conditional)
(else_clause "else" @conditional)
(select_statement [ "select" "end" ] @conditional)
(case_clause "case" @conditional)
(break_statement) @conditional

; Repeats

(for_statement [ "for" "end" ] @repeat)
(while_statement [ "while" "do" "then" "end" ] @repeat)
(continue_statement) @repeat

; Exceptions

(try_statement [ "try" "end" ] @exception)
(catch_clause "catch" @exception)

; Variables

(identifier) @variable

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

; Types

((identifier) @type
  (#lua-match? @type "^_*[A-Z][a-zA-Z0-9_]+$"))

; Functions

(function_definition
  "function" @keyword.function
  name: (identifier) @function
  [ "end" "endfunction" ]? @keyword.function)

(function_call
  name: (identifier) @function.call)

(return_statement) @keyword.return

; Parameters

(arguments (identifier) @parameter)

; Punctuation

[ ";" "," "." ] @punctuation.delimiter

[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket

; Operators

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

; Literals

(string) @string

(special_escape_sequence) @string.escape
(formatting_sequence) @string.special

(number) @number

(boolean) @boolean

; Comments

[ (comment) (line_continuation) ] @comment @spell

; Errors

(ERROR) @error

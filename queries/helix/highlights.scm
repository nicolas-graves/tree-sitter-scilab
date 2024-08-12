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
  "function" @keyword.function
  name: (identifier) @function
  [ "end" "endfunction" ]? @keyword.function)

(function_call name: (identifier) @function)
(return_statement) @keyword.control.return

; Assignments

(assignment left: (_) @variable)
(multioutput_variable (_) @variable)

; Parameters

(arguments (identifier) @variable.parameter)

; Conditionals

(if_statement [ "if" "end" ] @keyword.control.conditional)
(elseif_clause "elseif" @keyword.control.conditional)
(else_clause "else" @keyword.control.conditional)
(select_statement [ "select" "end" ] @keyword.control.conditional)
(case_clause "case" @keyword.control.conditional)
(break_statement) @keyword.control.conditional

; Repeats

(for_statement [ "for" "end" ] @keyword.control.repeat)
(while_statement [ "while" "do" "then" "end" ] @keyword.control.repeat)
(continue_statement) @keyword.control.repeat

; Exceptions

(try_statement [ "try" "end" ] @keyword.control.exception)
(catch_clause "catch" @keyword.control.exception)

; Punctuation

[ ";" "," "." ] @punctuation.delimiter
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket

; Literals

(special_escape_sequence) @constant.character.escape
(formatting_sequence) @constant.character.escape
(string) @string
(number) @constant.numeric.float
(unary_operator ["+" "-"] @constant.numeric.float)
(boolean) @constant.builtin.boolean

; Comments

[ (comment) (line_continuation) ] @comment.line

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

; Keywords

[
  "end"
  "global"
] @keyword

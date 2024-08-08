"end" @indent.end @indent.branch

[
  (if_statement)
  (for_statement)
  (while_statement)
  (select_statement)
  (try_statement)
  (function_definition)
] @indent.begin

[
  "elseif"
  "else"
  "case"
  "catch"
] @indent.branch

((matrix (row) @indent.align)
 (#set! indent.open_delimiter "[")
 (#set! indent.close_delimiter "]"))
((cell (row) @indent.align)
 (#set! indent.open_delimiter "{")
 (#set! indent.close_delimiter "}"))
((parenthesis) @indent.align
 (#set! indent.open_delimiter "(")
 (#set! indent.close_delimiter ")"))

(comment) @indent.auto

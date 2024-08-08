(_ (block) @block.inner) @block.outer
(block (_) @statement.outer)
(source_file (_) @statement.outer)

(function_call
  (arguments)? @call.inner) @call.outer
((arguments ","? @_start . (_) @parameter.inner . )
 (#make-range! "parameter.outer" @_start @parameter.inner))
((arguments (_) @parameter.inner . "," @_end)
 (#make-range! "parameter.outer" @parameter.inner @_end))

(if_statement
  (block) @conditional.inner) @conditional.outer
(if_statement
  (elseif_clause
    (block) @conditional.inner))
(if_statement
  (else_clause
    (block) @conditional.inner))

(select_statement
  (case_clause (block) @conditional.inner)) @conditional.outer

(select_statement
 (else_clause (block) @conditional.inner))

(for_statement
  (block) @loop.inner) @loop.outer
(while_statement
  (block) @loop.inner) @loop.outer

(global_operator
  (identifier) @parameter.inner)

(function_definition
  (block) @function.inner) @function.outer

(function_output (identifier) @parameter.inner @parameter.outer)

((arguments ","? @_start . (_) @parameter.inner . )
 (#make-range! "parameter.outer" @_start @parameter.inner))
((arguments (_) @parameter.inner . "," @_end)
 (#make-range! "parameter.outer" @parameter.inner @_end))

((multioutput_variable ","? @_start . (_) @parameter.inner . )
 (#make-range! "parameter.outer" @_start @parameter.inner))
((multioutput_variable (_) @parameter.inner . "," @_end)
 (#make-range! "parameter.outer" @parameter.inner @_end))

(try_statement
  (block) @conditional.inner) @conditional.outer
(catch_clause
  (block) @conditional.inner)

(number) @number.inner
(_ (return_statement) @return.inner @return.outer)
(comment) @comment.outer

(matrix (row) @parameter.outer)
(cell (row) @parameter.outer)
(row (_) @parameter.inner)

(assignment
  left: (_) @assignment.lhs
  (_) @assignment.rhs) @assignment.outer

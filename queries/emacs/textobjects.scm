(_ (block) @block.inner) @block.outer
(block (_) @statement.outer)
(source_file (_) @statement.outer)

(function_call
  (arguments)? @call.inner) @call.outer
((arguments ","? @parameter.outer._start . (_) @parameter.outer._end @parameter.inner . ))
((arguments (_) @parameter.outer._start @parameter.inner . "," @parameter.outer._end))

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

((multioutput_variable ","? @parameter.outer._start . (_) @parameter.outer._end @parameter.inner . ))
((multioutput_variable (_) @parameter.inner @parameter.outer._start . "," @parameter.outer._end))

((arguments ","? @parameter.outer._start . (_) @parameter.inner._end @parameter.inner . ))
((arguments (_) @parameter.outer._start @parameter.inner . "," @parameter.outer._end))

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

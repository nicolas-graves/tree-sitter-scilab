; References

(identifier) @reference

; Definitions

(function_definition
  name: (identifier) @definition.function
  (arguments
    (identifier)* @definition.parameter
    ("," (identifier) @definition.parameter)*)?) @scope

(assignment left: (identifier) @definition.var)
(multioutput_variable (identifier) @definition.var)

(iterator . (identifier) @definition.var)

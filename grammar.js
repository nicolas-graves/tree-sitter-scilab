// -*- js-indent-level: 2; -*-
const PREC = {
  parentheses: -1,
  or: 10,
  and: 11,
  compare: 13,
  bitwise_or: 14,
  bitwise_and: 15,
  not: 16,
  plus: 18,
  times: 19,
  unary: 20,
  postfix: 21,
  power: 22,
  call: 23,
  line_continuation: 24,
  comment: 25,
}

module.exports = grammar({
  name: 'scilab',
  extras: $ => [/\s/, $.comment, $.line_continuation],
  conflicts: $ => [
    [$._binary_operand, $._range_element],
    [$._unary_operand, $._assignment_lhs],
    [$._unary_operand, $.function_arguments],
    [$.range],
    [$._expression, $._additive_spaced_binary_operator],
    [$.matrix, $._multioutput_variable_multiple_sep],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice($._block, $.function_definition)),

    _block: $ => prec.right(repeat1(seq(
      choice($._expression, $._statement, $.function_definition),
      repeat1($._end_of_line),
    ))),
    block: $ => $._block,

    _statement: ($) => choice(
      $.assignment,
      $.break_statement,
      $.continue_statement,
      $.return_statement,
      $.for_statement,
      $.global_operator,
      $.if_statement,
      $.select_statement,
      $.try_statement,
      $.while_statement,
    ),

    _binary_operand: $ => choice(
      $.binary_operator,
      $.boolean_operator,
      $.cell,
      $.comparison_operator,
      $.string,
      $._unary_operand,
    ),
    _expression: $ => choice($._binary_operand, $.range),

    parenthesis: $ => prec(PREC.parentheses, seq('(', $._expression, ')')),

    comment: _ => {
      const single_line_comment = seq('//', /(\\+(.|\r?\n)|[^\\\n])*/);
      const multi_line_comment = seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/');
      return token(prec(PREC.comment, choice(
        seq(repeat(seq(single_line_comment, choice('\n', '\r'), repeat(' '))), single_line_comment),
        multi_line_comment,
      )));
    },

    line_continuation: $ => prec(
      PREC.line_continuation, seq(
        '..', optional('.'), choice($._end_of_line, $.comment)
      )
    ),

    binary_operator: $ => {
      const table = [
        [prec.left, '+', PREC.plus],
        [prec.left, '-', PREC.plus],
        [prec.left, '*', PREC.times],
        [prec.left, '.*', PREC.times],
        [prec.left, '.*.', PREC.times],
        [prec.left, '*.', PREC.times],
        [prec.left, '/', PREC.times],
        [prec.left, './', PREC.times],
        [prec.left, './.', PREC.times],
        [prec.left, '/.', PREC.times],
        [prec.left, '\\', PREC.times],
        [prec.left, '.\\', PREC.times],
        [prec.left, '.\\.', PREC.times],
        [prec.left, '\\.', PREC.times],
        [prec.right, '^', PREC.power],
        [prec.right, '.^', PREC.power],
        [prec.left, '|', PREC.bitwise_or],
        [prec.left, '&', PREC.bitwise_and],
      ]

      const binary_expression = $._binary_operand;

      return choice(
        ...table.map(([fn, operator, precedence]) =>
          fn(
            precedence,
            seq(
              field('left', $._binary_operand),
              operator,
              field('right', $._binary_operand),
            )
          )
        )
      )
    },

    _unary_operand: $ => field(
      'operand', choice(
        $.boolean,
        $.constant,
        $.function_call,
        $.identifier,
        $.last_index,
        $.matrix,
        $.not_operator,
        $.number,
        $.parenthesis,
        $.postfix_operator,
        $.struct,
        $.unary_operator,
      )),
    unary_operator: $ => prec(PREC.unary, seq(choice('+', '-'), $._unary_operand)),
    not_operator: $ => prec(PREC.not, seq('~', $._unary_operand)),

    comparison_operator: $ => prec.left(PREC.compare, seq(
      $._expression, choice('<', '<=', '==', '~=', '<>', '>=', '>'), $._expression
    )),

    boolean_operator: $ => choice(
      prec.left(PREC.and, seq(
        field('left', $._expression), '&&', field('right', $._expression)
      )),
      prec.left(PREC.or, seq(
        field('left', $._expression), '||', field('right', $._expression)
      ))
    ),

    postfix_operator: $ => prec(PREC.postfix, seq(
      field('operand', choice($.cell, $._unary_operand)),
      choice(".'", "'"),
    )),

    special_escape_sequence: $ => token.immediate(
      prec(1, seq('\\', choice('\\', 'n', 'r', 't')))
    ),

    // More concise but less straightforward.
    // formatting_sequence: $ => token.immediate(prec(1, seq(
    //     // '%', choice(
    //       // '%', /(\d+\$)?[-+ #0]*\d*(\.\d+)?[cdeEfgGiosuxX]/
    //   // )))),

    string: $ => {
      const placeholder = seq(/[1-9]+\d*/, '$');
      const option = choice(
        '-',  // left align
        '+',  // sign (+ or -)
        ' ',  // prefix ' ' if 1st char of signed conversion is not a sign
        '#',  // convert value to alternate form
        '0',  // pad with leading zeros
      );
      const width = repeat(/\d/);
      const precision = seq('.', /\d+/);
      const conversion_character = choice(
        's', 'c',  // string or boolean
        'd', 'i',  // to signed int32
        'u',       // to unsigned uint32
        'o',       // to unsigned octal
        'x', 'X',  // to unsigned hexadecimal
        'f',       // to decimal notation %[\-]ddd.ddd
        'e', 'E',  // to exponential form %[\-]d.ddde+^-ddd
        'g', 'G',  // to e, E or f depending on the value
      );
      const formatting_opt_sequence = seq(
        optional(placeholder),
        repeat(option),
        optional(width),
        optional(precision),
      );
      const formatting_sequence = token.immediate(prec(1, seq(
        '%', choice('%', seq(formatting_opt_sequence, conversion_character))
      )));
      const neither_formatted_double = seq(
        '%', formatting_opt_sequence, /[^-0-9$\+ 0#\.cdeEfgGiosuxX%"]/,
      );
      const neither_formatted_single = seq(
        '%', formatting_opt_sequence, /[^-0-9$\+ 0#\.cdeEfgGiosuxX%']/,
      );
      return choice(
        seq(
          '"',
          repeat(choice(
            token.immediate(prec(1, repeat1(choice(
              /[^\\%"]/, '""', /\\[^nrt\\"]/, neither_formatted_double,
            )))),
            $.special_escape_sequence,
            alias(formatting_sequence, $.formatting_sequence),
          )),
          choice('"', '\\"', seq('%', formatting_opt_sequence, '"')),
        ),
        seq(
          "'",
          repeat(choice(
            token.immediate(prec(1, repeat1(choice(
              /[^\\%']/, "''", /\\[^nrt\\']/, neither_formatted_single,
            )))),
            $.special_escape_sequence,
            alias(formatting_sequence, $.formatting_sequence),
          )),
          choice("'", "\\'", seq('%', formatting_opt_sequence, "'")),
        ));
    },

    // Workaround for https://github.com/tree-sitter/tree-sitter/issues/2299
    _additive_spaced_binary_operator: $ => seq(
      field('left', $._binary_operand),
      /\s/, choice('+', '-'), /\s/,
      field('right', $._binary_operand),
    ),
    row: $ => {
      const comma = choice(',', /\s+,/);
      const sep = choice(prec(1, comma), /\s/);
      const argument = field('argument', choice($._expression, alias(
        $._additive_spaced_binary_operator, $.binary_operator
      )));
      return seq(repeat(seq(argument, sep)), argument, optional(sep));
    },
    matrix: $ => {
      const end_of_row = token.immediate(repeat1(choice(';', '\n', '\r')));
      return seq('[', optional(/\s/), repeat(seq($.row, end_of_row)), optional($.row), ']',);
    },
    cell: $ => {
      const end_of_row = token.immediate(repeat1(choice(';', '\n', '\r')));
      return seq('{', repeat(seq($.row, end_of_row)), optional($.row), '}');
    },

    ignored_argument: _ => prec(PREC.not+1, '_'),

    // A = B
    // A(1) = B
    // A.b = B
    // [A, B, _] = C
    _assignment_lhs: $ => choice(
      $.identifier,
      $.ignored_argument,
      $.struct,
      $.function_call
    ),
    // Workaround for https://github.com/tree-sitter/tree-sitter/issues/2299
    _multioutput_variable_single_sep: $ => {
      const argument = field('argument', $._assignment_lhs);
      const comma = choice(',', /\s+,/);
      const sep = choice(prec(1, comma), /\s/);
      return seq('[', argument, repeat(seq(sep, argument)), optional(/\s/), ']');
    },
    _multioutput_variable_multiple_sep: $ => {
      const argument = field('argument', $._assignment_lhs);
      return seq('[', repeat(choice(argument, choice(',', /\s/))), ']');
    },
    ranging_operator: _ => ':',
    assignment: $ => {
      const lhs = choice(
        $._assignment_lhs,
        alias($._multioutput_variable_multiple_sep, $.multioutput_variable),
      );
      const rhs = choice($._expression, $.ranging_operator);
      return seq(field('left', lhs), '=', field('right', rhs));
    },
    _identifier_assignment: $ => seq($.identifier, '=', $._expression),

    function_arguments: $ => {
      const argument = field('argument', choice(
        $.ranging_operator,
        $.ignored_argument,
        $.last_index,
        $._expression,
        alias($._identifier_assignment, $.assignment),
      ));
      return seq(argument, repeat(seq(',', argument)));
    },
    function_call: $ => prec.right(PREC.call, seq(
      field('name', choice($.identifier, $.function_call)),
      $._function_arguments
    )),

    _range_element: $ => choice(
      $.binary_operator,
      $.string,
      $._unary_operand,
    ),
    range: $ => {
      const operator = choice(':', /\s:/, /:\s/, /\s:\s/);
      return prec.right(
        PREC.postfix,
        seq(
          $._range_element,
          operator,
          $._range_element,
          optional(seq(operator, $._range_element))
        ),
      );
    },

    return_statement: _ => 'return',
    continue_statement: _ => 'continue',
    break_statement: _ => 'break',

    elseif_clause: ($) => seq(
      'elseif',
      field('condition', $._expression),
      optional('then'),
      optional($._end_of_line),
      optional($.block)
    ),
    else_clause: ($) => seq('else', optional($._end_of_line), optional($.block)),
    if_statement: ($) => seq(
      'if',
      field('condition', $._expression),
      optional('then'),
      optional($._end_of_line),
      optional($.block),
      repeat($.elseif_clause),
      optional($.else_clause),
      'end',
    ),

    iterator: $ => seq($.identifier, '=', $._expression),
    for_statement: $ => seq(
      'for',
      $.iterator,
      optional($._end_of_line),
      optional($.block),
      'end',
    ),

    while_statement: $ => seq(
      'while',
      field('condition', $._expression),
      optional(choice('do', 'then')),
      optional($._end_of_line),
      optional($.block),
      'end',
    ),

    case_clause: $ => seq(
      'case',
      field('condition', $._expression),
      optional('then'),
      optional($._end_of_line),
      optional($.block),
    ),

    select_statement: $ => seq(
      'select',
      field('condition', $._expression),
      $._end_of_line,
      repeat($.case_clause),
      optional($.else_clause),
      'end',
    ),

    _struct_element: $ => choice($.function_call, $.identifier),
    struct: $ => seq(
      repeat1(seq($._struct_element, '.')),
      $._struct_element
    ),

    global_operator: $ => seq('global', repeat($.identifier)),

    function_output: $ => seq(field('output', choice(
      $.identifier,
      alias($._multioutput_variable_single_sep, $.multioutput_variable)
    )), '='),
    _function_arguments: $ => seq(
      '(', field('arguments', alias(optional($.function_arguments), $.arguments)), ')'
    ),
    function_definition: $ => seq(
      'function',
      optional($.function_output),
      field('name', $.identifier),
      optional($._function_arguments),
      $._end_of_line,
      optional($.block),
      choice('end', 'endfunction'),
    ),

    catch_clause: $ => seq('catch', $._end_of_line, optional($.block)),
    try_statement: $ => seq(
      'try',
      optional($._end_of_line),
      optional($.block),
      optional($.catch_clause),
      'end',
    ),

    constant: _ => token.immediate(prec(1, choice(
      'SCI',
      'WSCI',
      'SCIHOME',
      'TMPDIR',
      'home',
      '%chars',
      '%e',
      '%eps',
      '%i',
      '%inf',
      '%nan',
      '%pi',
      '%s',
      '%z',
    ))),

    last_index: _ => '$',

    number: _ => /(\d+|\d+\.\d*|\.\d+)([dDeE][+-]?\d+)?[ij]?/,

    boolean: _ => choice('%f', '%F', '%t', '%T'),

    identifier: _ => /[a-zA-Z_%][a-zA-Z0-9_]*/,

    _end_of_line: _ => choice(';', '\n', '\r', ','),
  },
});

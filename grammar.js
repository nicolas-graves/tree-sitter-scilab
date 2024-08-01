// -*- js-indent-level: 2; -*-
const PREC = {
  parentheses: -1,
  or: 10,
  and: 11,
  not: 12,
  compare: 13,
  bitwise_or: 14,
  bitwise_and: 15,
  xor: 16,
  shift: 17,
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
    [$._expression, $._range_element],
    [$._expression, $._binary_expression],
    [$._range_element, $._binary_expression],
    [$.range],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice($._block, $.function_definition)),

    _block: $ => prec.right(
      repeat1(seq(choice($._expression, $._statement), $._end_of_line))
    ),
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

    _expression: $ => prec.right(choice(
      $.binary_operator,
      $.boolean,
      $.boolean_operator,
      $.cell,
      $.comparison_operator,
      $.function_call,
      $.identifier,
      $.matrix,
      $.not_operator,
      $.number,
      $.parenthesis,
      $.postfix_operator,
      $.range,
      $.string,
      $.struct,
      $.unary_operator,
    )),

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

    _binary_expression: $ => choice(
      $.binary_operator,
      $.boolean,
      $.boolean_operator,
      $.cell,
      $.comparison_operator,
      $.function_call,
      $.identifier,
      $.matrix,
      $.not_operator,
      $.number,
      $.parenthesis,
      $.postfix_operator,
      $.string,
      $.struct,
      $.unary_operator,
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

      return choice(
        ...table.map(([fn, operator, precedence]) =>
          fn(
            precedence,
            seq(
              field('left', $._binary_expression),
              operator,
              field('right', $._binary_expression),
            )
          )
        )
      )
    },

    unary_operator: $ => prec(
      PREC.unary,
      seq(
        choice('+', '-'),
        field(
          'argument',
          choice(
            $.boolean,
            $.cell,
            $.function_call,
            $.identifier,
            $.matrix,
            $.not_operator,
            $.number,
            $.parenthesis,
            $.postfix_operator,
            $.struct,
            $.unary_operator,
          ),
        ),
      ),
    ),

    not_operator: $ => prec(PREC.not, seq('~', $._expression)),

    comparison_operator: $ => prec.left(PREC.compare, seq(
      $._expression, choice('<', '<=', '==', '~=', '>=', '>'), $._expression
    )),

    boolean_operator: $ => choice(
      prec.left(PREC.and, seq(
        field('left', $._expression), '&&', field('right', $._expression)
      )),
      prec.left(PREC.or, seq(
        field('left', $._expression), '||', field('right', $._expression)
      ))),

    postfix_operator: $ => prec(
      PREC.postfix,
      seq(
        field(
          'argument',
          choice(
            $.binary_operator,
            $.boolean,
            $.cell,
            $.function_call,
            $.identifier,
            $.matrix,
            $.number,
            $.parenthesis,
            $.postfix_operator,
            $.struct,
            $.unary_operator
          ),
        ),
        choice(".'", "'"),
      ),
    ),

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

    row: $ => prec.right(
      repeat1(seq(field('argument', $._expression), optional(','))),
    ),
    matrix: $ => seq(
      '[', repeat(seq($.row, choice(';', '\n', '\r'))), optional($.row), ']',
    ),
    cell: $ => seq(
      '{', repeat(seq($.row, choice(';', '\n', '\r'))), optional($.row), '}',
    ),

    ignored_argument: _ => prec(PREC.not+1, '_'),

    // A = B
    // A(1) = B
    // A.b = B
    // [A, B, _] = C
    assignment: $ => {
      const lhs = choice(
        $.identifier,
        $.ignored_argument,
        $.function_call,
        $.multioutput_variable,
        $.struct,
      );
      return seq(field('left', lhs), '=', field('right', $._expression));
    },

    multioutput_variable: $ => {
      const argument = field(
        'argument',
        choice(
          $.identifier,
          $.ignored_argument,
          $.struct,
          $.function_call
        )
      );
      return seq('[', argument, repeat(seq(optional(','), argument)), ']');
    },

    ranging_operator: _ => ':',

    function_arguments: $ => {
      const argument = field('argument', choice(
        $.ranging_operator, $.ignored_argument, $._expression
      ));
      return seq(argument, repeat(seq(',', argument)));
    },
    function_call: $ => prec.right(PREC.call, seq(
      field('name', choice($.identifier, $.function_call)),
      $._function_arguments
    )),

    // Unary operators cannot bind stronger in this case, lest the world falls apart.
    _range_element: $ => choice(
      prec.dynamic(1, $.binary_operator),
      $.boolean,
      $.function_call,
      $.identifier,
      $.matrix,
      $.not_operator,
      $.number,
      $.parenthesis,
      $.postfix_operator,
      $.struct,
      prec.dynamic(-1, $.unary_operator)
    ),
    range: $ => prec.right(
      PREC.postfix,
      seq(
        $._range_element,
        ':',
        $._range_element,
        optional(seq(':', $._range_element))
      ),
    ),

    return_statement: _ => 'return',
    continue_statement: _ => 'continue',
    break_statement: _ => 'break',

    elseif_clause: ($) => seq(
      'elseif',
      field('condition', $._expression),
      optional('then'),
      $._end_of_line,
      optional($.block)
    ),
    else_clause: ($) => seq('else', optional($.block)),
    if_statement: ($) => seq(
      'if',
      field('condition', $._expression),
      optional('then'),
      $._end_of_line,
      optional($.block),
      repeat($.elseif_clause),
      optional($.else_clause),
      'end',
    ),

    iterator: $ => seq($.identifier, '=', $._expression),
    for_statement: $ => seq(
      'for',
      $.iterator,
      $._end_of_line,
      optional($.block),
      'end',
    ),

    while_statement: $ => seq(
      'while',
      field('condition', $._expression),
      $._end_of_line,
      optional($.block),
      'end',
    ),

    case_clause: $ => seq(
      'case',
      field('condition', $._expression),
      optional('then'),
      $._end_of_line,
      optional($.block)
    ),

    select_statement: $ => seq(
      'select',
      field('condition', $._expression),
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

    function_output: $ => seq(
      field('output', choice($.identifier, $.multioutput_variable)), '='
    ),
    _function_arguments: $ => seq(
      '(', field('arguments', alias(optional($.function_arguments), $.arguments)), ')'
    ),
    function_definition: $ => seq(
      'function',
      optional($.function_output),
      field('name', $.identifier),
      optional($._function_arguments),
      $._end_of_line,
      $.block,
      optional(choice('end', 'endfunction')),
    ),

    catch: $ => seq('catch', $._end_of_line, optional($.block)),
    try_statement: $ => seq(
      'try',
      $._end_of_line,
      optional($.block),
      optional($.catch),
      'end',
    ),

    number: _ => /(\d+|\d+\.\d*|\.\d+)([eE][+-]?\d+)?[ij]?/,

    boolean: _ => choice('%f', '%F', '%t', '%T'),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    _end_of_line: _ => choice(';', '\n', '\r', ','),
  },
});

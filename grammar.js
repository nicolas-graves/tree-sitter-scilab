// -*- js-indent-level: 2; -*-
const PREC = {
  parenthesized_expression: 1,
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
  power: 21,
  call: 22,
  postfix: 23,
  line_continuation: 24,
  comments: 25,
}

module.exports = grammar({
  name: 'scilab',
  extras: ($) => [/\s/, $.comment, $.line_continuation],
  conflicts: ($) => [[$._expression, $.assignment]],
  word: ($) => $.identifier,
  rules: {
    source_file: ($) =>
      repeat(seq(choice($._expression, $._statement), optional($._end_of_line))),
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    _end_of_line: ($) => choice(';', '\n', '\r', ','),

    _operator: ($) =>
      choice($._prefix_operator, $._infix_operator, $._postfix_operator),
    _prefix_operator: ($) => choice('~', '+', '-'),
    _infix_operator: ($) =>
      choice(
        '&',
        '|',
        '&&',
        '||',
        '==',
        '~=',
        '<',
        '>',
        '<=',
        '>=',
        '+',
        '-',
        '.*',
        '*',
        './',
        '/',
        '.\\',
        '\\',
        '.^',
        '^'
      ),
    _postfix_operator: ($) => choice("'", ".'"),

    number: ($) =>
      choice(
        $._integer,
        $._float,
        $._float_alt,
        $._bin_number,
        $._hex_number,
        $._sci_number,
        $._complex_number
      ),
    _integer: ($) => /[+-]?\d+/,
    _float: ($) => /[+-]?\d+\.\d*/,
    _float_alt: ($) => /[+-]?\.\d+/,
    _bin_number: ($) => /0[bB][0-1]+/,
    _hex_number: ($) => /0[xX][\dA-Fa-f]+/,
    // token does no accept $. so we have to inline
    _sci_number: ($) =>
      token(
        seq(
          choice(/[+-]?\d+/, /[+-]?\d+\.\d*/, /[+-]?\.\d+/),
          /[eE][+-]?/,
          /\d+/
        )
      ),
    _complex_number: ($) =>
      token(
        seq(
          choice(
            /[+-]?\d+/,
            /[+-]?\d+\.\d*/,
            /[+-]?\.\d+/,
            seq(
              choice(/[+-]?\d+/, /[+-]?\d+\.\d*/, /[+-]?\.\d+/),
              /[eE][+-]?/,
              /\d+/
            )
          ),
          /[ij]/
        )
      ),

    _statement: ($) => choice($.assignment),

    _expression: ($) => choice(
      $.binary_operator,
      $.boolean_operator,
      $.cell_definition,
      $.comparison_operator,
      $.function_call,
      $.identifier,
      $.matrix_definition,
      $.number,
      $.parenthesized_expression,
      $.postfix_operator,
      $.range,
      $.string,
      $.unary_operator
    ),

    parenthesized_expression: ($) =>
      prec(PREC.parenthesized_expression, seq('(', $._expression, ')')),


    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    // the repeat part ensure that multiple following // comments are parsed as a single (comment)
    comment: _ => token(prec(PREC.comments, (choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/,
         repeat(seq(optional(alias(/[\n]{1}[ ]*/,'')), '//', /(\\+(.|\r?\n)|[^\\\n])*/))),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )))),

    line_continuation: $ => prec(
      PREC.line_continuation, seq(
        '..', optional('.'), choice($._end_of_line, $.comment)
      )
    ),

    binary_operator: ($) => {
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
              field('left', $._expression),
              operator,
              field('right', $._expression)
            )
          )
        )
      )
    },

    unary_operator: $ => prec(
      PREC.unary,
      seq(
        choice('+', '-', '~'),
        field('argument', $._expression)
      )
    ),

    comparison_operator: $ => prec.left(PREC.compare, seq(
      $._expression, choice('<', '<=', '==', '~=', '>=', '>'), $._expression
    )),

    boolean_operator: ($) => choice(
      prec.left(PREC.and, seq(
        field('left', $._expression), '&&', field('right', $._expression)
      )),
      prec.left(PREC.or, seq(
        field('left', $._expression), '||', field('right', $._expression)
      ))),

    postfix_operator: ($) => prec(
      PREC.postfix,
      seq(
        field('argument', $._expression),
        choice(".'", "'"),
      )
    ),

    string: ($) =>
      choice(seq('"', /([^"]|(""))*/, '"'), seq("'", /([^']|(''))*/, "'")),

    _expression_sequence: ($) =>
      repeat1(seq(field('argument', $._expression), optional(','))),
    row: ($) =>
      prec.right(
        seq($._expression_sequence, optional(choice(';', '\n', '\r')))
      ),

    matrix_definition: ($) => seq('[', repeat($.row), ']'),
    cell_definition: ($) => seq('{', repeat($.row), '}'),

    ignored_argument: _ => prec(PREC.not+1, '_'),

    assignment: ($) =>
      choice(
        // A = B
        seq(
          field('variable', $.identifier),
          '=',
          field('value', $._expression)
        ),
        // [A, B, _] = C
        seq(
          '[',
          field(
            'variable',
            repeat1(
              seq(
                field('argument', choice($.identifier, $.ignored_argument)),
                optional(',')
              )
            )
          ),
          ']',
          '=',
          field('value', $._expression)
        ),
        // A(1) = B
        seq(
          field('variable', $.function_call),
          '=',
          field('value', $._expression)
        )
      ),

    _function_arguments: ($) =>
      seq(
        field('argument', $._expression),
        optional(repeat(seq(',', field('argument', $._expression))))
      ),
    _args: ($) => seq(
      '(', field('arguments', optional($._function_arguments)), ')',),
    function_call: ($) =>
      prec.right(PREC.call, seq(field('name', $.identifier), $._args)),

    range: ($) => seq(
      $._range_element,
      ':',
      $._range_element,
      optional(seq(':', $._range_element))
    ),

    _range_element: ($) => choice($.identifier, $.number, $.function_call),
  },
})

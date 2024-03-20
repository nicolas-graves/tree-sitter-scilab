const PREC = {
  // this resolves a conflict between the usage of ':' in a lambda vs in a
  // typed parameter. In the case of a lambda, we don't allow typed parameters.
  lambda: -2,
  typed_parameter: -1,
  conditional: -1,

  parenthesized_expression: 1,
  parenthesized_list_splat: 1,
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
  comments: 25,
}

module.exports = grammar({
  name: 'scilab',
  extras: ($) => [/\s/, $.comment],
  word: ($) => $.identifier,
  rules: {
    source_file: ($) =>
      repeat(seq($._expression, optional($._end_of_line))),
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

    _expression: ($) => choice(
      $.binary_operator,
      $.boolean_operator,
      $.cell_definition,
      $.comparison_operator,
      $.identifier,
      $.matrix_definition,
      $.number,
      $.parenthesized_expression,
      $.postfix_operator,
      $.string,
      $.unary_operator
    ),

    parenthesized_expression: ($) => seq('(', $._expression, ')'),

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
    row: ($) => prec.right(seq($._expression_sequence, optional(';'))),
    matrix_definition: ($) => seq('[', repeat($.row), ']'),
    cell_definition: ($) => seq('{', repeat($.row), '}'),
  },
})
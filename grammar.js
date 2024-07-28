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
  conflicts: ($) => [
    [$._expression, $.assignment], // TODO Remove me.
    [$._expression, $._range_element],
    [$._expression, $._binary_expression],
    [$._range_element, $._binary_expression],
    [$.range],
  ],
  word: ($) => $.identifier,
  rules: {
    source_file: ($) => optional($._block),

    _block: ($) =>
      repeat1(seq(choice($._expression, $._statement), $._end_of_line)),
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    block: ($) => $._block,

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

    boolean: ($) => choice('%f', '%F', '%t', '%T'),

    number: ($) => /(\d+|\d+\.\d*|\.\d+)([eE][+-]?\d+)?[ij]?/,

    _statement: ($) => choice(
      $.break_statement,
      $.continue_statement,
      $.return_statement,
      $.assignment,
      $.for_statement,
      $.if_statement,
      $.select_statement,
      $.while_statement,
    ),

    _expression: ($) => choice(
      $.binary_operator,
      $.boolean,
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
      $.struct,
      $.unary_operator,
      $.not_operator,
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

    _binary_expression: ($) => choice(
      $.binary_operator,
      $.boolean,
      $.boolean_operator,
      $.cell_definition,
      $.comparison_operator,
      $.function_call,
      $.identifier,
      $.matrix_definition,
      $.not_operator,
      $.number,
      $.parenthesized_expression,
      $.postfix_operator,
      $.string,
      $.struct,
      $.unary_operator,
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
              field('left', $._binary_expression),
              operator,
              field('right', $._binary_expression),
            )
          )
        )
      )
    },

    unary_operator: ($) => prec(
      PREC.unary,
      seq(
        choice('+', '-'),
        field(
          'argument',
          choice(
            $.boolean,
            $.cell_definition,
            $.function_call,
            $.identifier,
            $.matrix_definition,
            $.not_operator,
            $.number,
            $.parenthesized_expression,
            $.postfix_operator,
            $.struct,
            $.unary_operator,
          ),
        ),
      ),
    ),

    not_operator: ($) => prec(
      PREC.not,
      seq(
        '~',
        choice(
          $.boolean,
          $.function_call,
          $.identifier,
          $.matrix_definition,
          $.not_operator,
          $.number,
          $.parenthesized_expression,
          $.postfix_operator,
          $.struct,
          $.unary_operator,
        ),
      ),
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
        field(
          'argument',
          choice(
            $.binary_operator,
            $.boolean,
            $.cell_definition,
            $.function_call,
            $.identifier,
            $.matrix_definition,
            $.number,
            $.parenthesized_expression,
            $.postfix_operator,
            $.string,
            $.struct,
            $.unary_operator
          ),
        ),
        choice(".'", "'"),
      ),
    ),

    special_escape_sequence: ($) =>
      token.immediate(prec(1, seq('\\', choice('\\', 'n', 'r', 't')))),

    // More concise but less straightforward.
    // formatting_sequence: ($) => token.immediate(prec(1, seq(
    //     // '%', choice(
    //       // '%', /(\d+\$)?[-+ #0]*\d*(\.\d+)?[cdeEfgGiosuxX]/
    //   // )))),

    string: ($) => {
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
        // A(1) = B
        // A.b = B
        seq(
          field('variable', choice($.identifier, $.function_call, $.struct)),
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
                field(
                  'argument',
                  choice(
                    $.identifier,
                    $.ignored_argument,
                    $.struct,
                    $.function_call
                  )
                ),
                optional(',')
              )
            )
          ),
          ']',
          '=',
          field('value', $._expression)
        ),
      ),

    ranging_operator: ($) => ':',

    _function_arguments: ($) =>
      seq(
        field('argument', choice($.ranging_operator, $._expression)),
        optional(
          repeat(
            seq(
              ',',
              field('argument', choice($.ranging_operator, $._expression))
            )
          )
        )
      ),
    _args: ($) => seq(
      '(', field('arguments', optional($._function_arguments)), ')',),
    function_call: ($) =>
      prec.right(PREC.call, seq(field('name', $.identifier), $._args)),

    // Unary operators cannot bind stronger in this case, lest the world falls apart.
    _range_element: ($) => choice(
      prec.dynamic(1, $.binary_operator),
      $.boolean,
      $.function_call,
      $.identifier,
      $.matrix_definition,
      $.not_operator,
      $.number,
      $.parenthesized_expression,
      $.postfix_operator,
      $.struct,
      prec.dynamic(-1, $.unary_operator)
    ),
    range: ($) => seq(
      $._range_element,
      ':',
      $._range_element,
      optional(seq(':', $._range_element))
    ),

    return_statement: _ => 'return',
    continue_statement: _ => 'continue',
    break_statement: _ => 'break',

    elseif_statement: ($) => seq(
      'elseif',
      field('condition', $._expression),
      optional('then'),
      $._end_of_line,
      optional($.block)
    ),
    else_statement: ($) => seq('else', optional($.block)),
    if_statement: ($) => seq(
      'if',
      field('condition', $._expression),
      optional('then'),
      $._end_of_line,
      optional($.block),
      repeat($.elseif_statement),
      optional($.else_statement),
      'end',
    ),

    iterator: ($) => seq($.identifier, '=', $._expression),
    for_statement: ($) => seq(
      'for',
      $.iterator,
      $._end_of_line,
      optional($.block),
      'end',
    ),

    while_statement: ($) => seq(
      'while',
      field('condition', $._expression),
      $._end_of_line,
      optional($.block),
      'end',
    ),

    select_statement: ($) => seq(
      'select',
      field('argument', alias($._expression, $.condition)),
      repeat(
        seq(
          'case',
          alias($._expression, $.condition),
          optional('then'),
          $._end_of_line,
          optional($.block)
        )
      ),
      optional($.else_statement),
      'end',
    ),

    _struct_element: ($) => choice($.function_call, $.identifier),
    struct: ($) =>
      seq(
        repeat1(seq($._struct_element, '.')),
        $._struct_element
      ),
  },
})

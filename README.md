# Scilab grammar for tree-sitter

This is a tree-sitter parser for the [Scilab](https://www.scilab.org/) programming language. It doesn't try to be "correct" in the sense that it is close to what Scilab executes.

# Known Issues

## Command calls

Scilab cannot be parsed with a LR(1) parser due to some corner cases. In particular, it has a way to [convert functions into CLI-style calls](https://help.scilab.org/docs/2024.0.0/en_US/functions.html) :

> When a function has no left hand side argument and is called only with character string arguments, the calling syntax may be simplified:
> ```
> fun('a','toto','a string')
> ```
> is equivalent to:
> ```
> fun a toto 'a string'
> ```

Due to this behaviour, I'm unable to properly parse these examples[^1]:
``` scilab
function A(x, y)
    disp(x,y);
endfunction;

A + 2
pwd
```

This repository is restrained to a version of Scilab that does not try to parse functions calls in CLI-style.

[^1]: It seems that the problem doesn't appear in Matlab since `disp + ;` is correct in Matlab and `disp + 2;` isn't (see [this line](https://github.com/acristoffers/tree-sitter-matlab/blob/2825fb578325ac308945318881445a89ea06e0f6/src/scanner.c#L371)), while they are both correct in Scilab.

## Other known issues

Some rules in `grammar.js` are not at their right place due to [this upstream issue](https://github.com/tree-sitter/tree-sitter/issues/2299) which should be fixed at tree-sitter 1.0 release.

Because it's not possible to both alias properly and define a `spaced_binary_operator` inside the `row` rule, it's currently not possible to easily parse the following examples:

``` scilab
[ a * b , c ^ d ]
[ a ,b ] = meshgrid(1:2, 1:2);
```

Until this is fixed in tree-sitter upstream, this will remain unfixed.

# Acknowlegment

This project wouldn't have been possible without [tree-sitter-matlab](https://github.com/acristoffers/tree-sitter-matlab) or Scilab itself, kudos to their developpers.

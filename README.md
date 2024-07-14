Work in progress

# Scope of the repository

Scilab is not a good language for a LR(1) parser. In some corner cases, it's not possible to determine whether an expression is a command or another operation. In particular, Scilab has a way to [convert functions into CLI-style calls](https://help.scilab.org/docs/2024.0.0/en_US/functions.html) :

>
> When a function has no left hand side argument and is called only with character string arguments, the calling syntax may be simplified:
> ```
> fun('a','toto','a string')
> ```
> is equivalent to:
> ```
> fun a toto 'a string'
> ```

Due to this behaviour, I'm unable to properly parse this example :
```
A + 2
```

We generally want to parse this as an addition of identifier and number, but since functions have precedence over addition here, `A` can well be a function that takes "+" and "2" as arguments (e.g. with the function below).

```scilab
function A(x, y)
    disp(x,y);
endfunction;
```

Due to this strong constraint, this repository will be restrainted to a version of Scilab that does not try to parse functions under CLI-style calls.

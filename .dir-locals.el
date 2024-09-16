((nil
  . ((compile-command . "make check PREFIX=\"guix shell -m manifest.scm --\"")
     (eval . (setq compilation-directory
                   (file-name-directory
                    (let ((d (dir-locals-find-file default-directory)))
                      (if (stringp d) d (car d)))))))))

---
redirectFrom:
  - /hyphen-files.html
  - /file-name-trailing-hyphens.html
---

[🏠 방성범 블로그](/README.md) > [🐧 리눅스](/linux.md)

# 파일 이름 끝 하이픈

<time id="date-published" datetime="2020-04-21">2020. 4. 21.</time>

리눅스에서 `/etc/group-`, `/etc/passwd-`, `/etc/shadow-`의 파일 이름 끝에 있는 하이픈(`-`)은 백업 파일을 의미합니다.

리눅스 매뉴얼에서 `/etc/shadow-`이 백업 용도로 사용된다는 사실을 확인할 수 있습니다[^shadow].

[^shadow]:
    [SHADOW(5) - man7.org](http://man7.org/linux/man-pages/man5/shadow.5.html#FILES)

    > /etc/shadow-
    > Backup file for /etc/shadow.

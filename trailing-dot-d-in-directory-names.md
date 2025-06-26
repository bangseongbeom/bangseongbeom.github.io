---
category: linux
redirectFrom: [/dot-d-directories.html]
---

[🏠 방성범 블로그](/README.md) > [🐧 리눅스](/linux.md)

# 디렉터리 이름 끝 '.d'

<time id="published" datetime="2020-04-19">2020. 4. 19.</time>

리눅스의 `/etc` 디렉터리 안에는 여러 하위 디렉터리가 존재합니다. 이중 이름 끝에 붙는 `.d`는 무엇을 의미할까요?

## 의미

`.d`는 "D"irectiory의 "D"에서 따왔습니다. 기존 단일 설정 파일과의 이름 충돌을 피하기 위해, 여러 설정 파일을 디렉터리로서 묶는다는 의미로 `.d`를 붙이게 되었습니다.

## .d 디렉터리는 어디에?

리눅스의 `/etc` 디렉터리에는 리눅스에 설치된 소프트웨어들에 대한 각종 설정 파일이 들어있습니다. 여기에 `.d`로 끝나는 디렉터리가 있습니다. `exports.d`, `sudoers.d`같이 `.d`로 끝나는 디렉터리를 확인할 수 있습니다:

```sh
ls /etc
```

```
acpi                     ethertypes           ld.so.conf.d       pm                shadow
adjtime                  exports              libaudit.conf      popt.d            shadow-
aliases                  exports.d            libnl              postfix           shells
aliases.db               filesystems          libuser.conf       ppp               skel
alternatives             fstab                locale.conf        prelink.conf.d    ssh
amazon                   gcrypt               localtime          printcap          ssl
anacrontab               GeoIP.conf           login.defs         profile           statetab
at.deny                  GeoIP.conf.default   logrotate.conf     profile.d         statetab.d
audisp                   gnupg                logrotate.d        protocols         subgid
audit                    GREP_COLORS          lsm                python            subuid
bash_completion.d        groff                lvm                rc0.d             sudo.conf
bashrc                   group                machine-id         rc1.d             sudoers
binfmt.d                 group-               magic              rc2.d             sudoers.d
```

## 이유

초창기 유닉스에서는 각 소프트웨어에 대한 설정 파일이 하나씩만 있었습니다. `/etc/rc`, `/etc/exports` 처럼요. 그때까지만 하더라도 단일 파일로 설정을 관리하는 것은 별 문제가 되지 않았습니다[^debian-1].

[^debian-1]:
    [Russ Allbery](https://wiki.debian.org/RussAllbery) (데비안 프로젝트 기여자). [Re: What does .d at the end of some dirctory and filenames actually stand for?](https://lists.debian.org/debian-devel/2010/04/msg00352.html)

    > Once upon a time, most UNIX software was controlled by a single configuration file per software package, and all the configuration details for that package went into that file. This worked reasonably well when that file was hand-crafted by the system administrator for local needs.

하지만 시대가 변하고 서버가 해야 할 일이 점점 복잡해져감에 따라, 설정 파일의 관리도 어려워졌습니다. 특히 특정 소프트웨어가 설치되면서 해당 소프트웨어가 의존하고 있는 다른 소프트웨어의 설정을 건드리는 경우가 있는데, 이러한 경우 이미 잘 작성해 놓은 설정 파일을 마음대로 수정하기가 상당히 난처할 수밖에 없습니다[^debian-2].

[^debian-2]:
    [Russ Allbery](https://wiki.debian.org/RussAllbery) (데비안 프로젝트 기여자). [Re: What does .d at the end of some dirctory and filenames actually stand for?](https://lists.debian.org/debian-devel/2010/04/msg00352.html)

    > When distribution packaging became more and more common, it became clear that we needed better ways of forming such configuration files out of multiple fragments, often provided by multiple independent packages. Each package that needs to configure some shared service should be able to manage only its configuration without having to edit a shared configuration file used by other packages.

그래서 하나의 디렉터리에 여러 설정 파일을 두기로 했습니다[^debian-3].

[^debian-3]:
    [Russ Allbery](https://wiki.debian.org/RussAllbery) (데비안 프로젝트 기여자). [Re: What does .d at the end of some dirctory and filenames actually stand for?](https://lists.debian.org/debian-devel/2010/04/msg00352.html)

    > The most common convention adopted was to permit including a directory full of configuration files, where anything dropped into that directory would become active and part of that configuration.

**다만 기존에 이미 사용하던 `/etc/rc`같은 단일 설정 파일과의 이름 충돌을 방지하기 위해, 이 디렉터리의 이름에는 `/etc/rc.d`처럼 "D"irectory의 "D"를 붙여 설정을 위한 '디렉터리'임을 나타냅니다[^debian-4].**

[^debian-4]:
    [Russ Allbery](https://wiki.debian.org/RussAllbery) (데비안 프로젝트 기여자). [Re: What does .d at the end of some dirctory and filenames actually stand for?](https://lists.debian.org/debian-devel/2010/04/msg00352.html)

    > As that convention became more widespread, that directory was usually named after the configuration file that it was replacing or augmenting. But since one cannot have a directory and a file with the same name, some method was required to distinguish, so .d was appended to the end of the configuration file name. Hence, a configuration file /etc/Muttrc was augmented by fragments in /etc/Muttrc.d, /etc/bash_completion was augmented with /etc/bash_completion.d/\*, and so forth.

## 언제나 .d를 붙이는 것은 아니다

`.d`를 붙이는 것은 그저 관례일 뿐입니다. 개발 초기부터 단일 파일 형식을 지원하지 않는 소프트웨어의 경우 `.d`를 붙이지 않는 경우가 많습니다. [아파치 HTTP 서버](https://httpd.apache.org/)는 `/etc/apache2` 자체가 디렉터리지만 `.d`를 붙이지 않습니다.

## 참고

- [What does the .d stand for in directory names? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/4029/what-does-the-d-stand-for-in-directory-names): 관련 스택오버플로 질문
- [In linux, why are folders for configuration files always named \*.d - Super User](https://superuser.com/questions/230247/in-linux-why-are-folders-for-configuration-files-always-named-d): 관련 스택오버플로 질문

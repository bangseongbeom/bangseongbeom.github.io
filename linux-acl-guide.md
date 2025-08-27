---
redirect_from: [/linux-acl.html]
---

[방성범 블로그](/README.md) ▸ [리눅스](/linux.md)

# 리눅스 ACL 가이드

<time id="date-published" datetime="2019-07-15">2019. 7. 15.</time>

사용자 하나와 그룹 하나에게만 권한을 줄 수 있는 파일 퍼미션을 확장하여, 여러 명의 사용자와 그룹에게 접근 권한을 줄 수 있는 ACL(Access Control List)에 대해 알아봅니다.

## 파일 퍼미션 vs ACL

|                | 파일 퍼미션                     | ACL                    |
| -------------- | ------------------------------- | ---------------------- |
| 관련 명령어    | `chmod`, `umask`                | `getfacl`, `setfacl`   |
| 권한 지정 대상 | 사용자 하나, 그룹 하나(`chmod`) | 사용자 여렷, 그룹 여럿 |
| 기본값 권한    | 계정 로그인 시 적용(`umask`)    | 폴더 별로 적용         |

- [`chmod`](https://linux.die.net/man/1/chmod)를 이용해 권한을 결정하는 기존 파일 퍼미션의 경우 **사용자 하나와 그룹 하나**만 읽기, 쓰기, 실행 권한을 가질 수 있습니다. ACL을 이용하면 추가적으로 **여러 명의 사용자와 그룹**도 읽기, 쓰기, 실행 권한을 가질 수 있습니다.
- ACL은 '기본값 ACL'이라는 기능을 통해 마치 **`umask`를 폴더 별로 적용**하는 듯한 효과를 만들 수 있습니다.

## 설치

대부분의 리눅스 배포판에는 ACL이 포함되어 있습니다. 데비안 계열 배포판에서 ACL이 처음부터 설치되어 있지 않은 경우 `sudo apt install acl` 명령을 통해 ACL을 설치할 수 있습니다.

## `getfacl`

[`getfacl`](https://linux.die.net/man/1/getfacl)(**Get** **F**ile **A**ccess **C**ontrol **L**ists)은 해당 파일 또는 디렉터리의 ACL 정보를 확인하는 리눅스 명령어입니다. `getfacl <파일 이름>`처럼 사용합니다:

- `getfacl my-test-file`: `my-test-file` 파일의 ACL 정보를 확인합니다.

`getfacl`을 사용하면 다음과 같은 ACL 정보를 얻을 수 있습니다:

```
# file: test-file
# owner: ubuntu
# group: ubuntu
user::rw-
group::r--
other::r--
```

`# file: test-file`는 파일 이름, `# owner: ubuntu`, `# group: ubuntu`는 리눅스 파일 퍼미션에서의 소유자와 소유 그룹을 뜻합니다(이들은 `chown`과 `chgrp` 명령어로 변경할 수 있습니다). 이것들은 ACL 정보를 알아보기 쉽게 하기 위해 같이 출력되는 일종의 주석입니다.

진짜 ACL은 그 밑에 있는 `user::rw-`, `group::r--`, `other::r--`입니다.

## ACL 항목

ACL에서는 특정한 대상에게 권한을 주는 것을 하나의 **항목**으로 관리합니다. 각 ACL 항목(entry)은 다음과 같은 텍스트로 구성됩니다:

```
<타입>:<사용자 및 그룹 이름>:<권한>
```

**타입**과 **이름**은 권한을 받을 대상을 결정합니다. 타입으로는 `user`, `group`, `mask`, `other`가 있습니다. ID에는 리눅스 사용자 이름, 또는 리눅스 그룹 이름이 들어가지만 타입에 따라 이름을 필요로 하지 않는 경우도 있습니다.

**권한**은 리눅스의 파일 퍼미션에서 볼 수 있었던 권한 설정과 똑같이 읽기, 쓰기, 실행 권한을 결정합니다. `rwx`, `r-x`, `---` 같은 식으로 나타냅니다.

### `user:<사용자 이름>:<권한>`

`user` 타입과 함께 사용자의 이름을 명시하면 해당 **사용자**에게 권한을 부여합니다.

- `user:ubuntu:r-x`: `ubuntu` 사용자에게 읽기(`r`), 실행(`w`) 권한을 부여합니다.

### `group:<그룹 이름>:<권한>`

`group` 타입과 함께 그룹 이름 명시하면 해당 **그룹**에게 권한을 부여합니다:

- `group:www-data:---`: `www-data` 그룹에게 아무런 권한도 부여하지 않습니다.

## `setfacl`

[`setfacl`](https://linux.die.net/man/1/setfacl)(**Set** **F**ile **A**ccess **C**ontrol **L**ists)은 해당 파일 또는 디렉터리의 ACL 정보를 설정하는 명령어입니다. `setfacl --modify <ACL 항목> <파일>`로 해당 파일에 항목을 설정 또는 수정하거나, `setfacl --remove <ACL 타입>:<사용자 및 그룹 이름> <파일>`로 해당 파일로부터 항목을 제거할 수 있습니다:

- `setfacl --modify user:ubuntu:rwx my-test-file`: `ubuntu` 사용자에게 읽기(`r`), 쓰기(`w`), 실행(`x`) 권한을 설정합니다. `ubuntu` 사용자에게 권한을 설정하는 ACL 항목이 이미 존재할 경우, 해당 항목을 수정합니다.
- `setfacl --remove user:ubuntu my-test-file`: `ubuntu` 사용자를 위한 ACL 항목을 제거합니다.

## 매핑 관계

기존 파일 시스템을 완전히 무시하고 순수하게 ACL만을 이용해 권한을 설정하면 좋겠지만[^pure-acl], 리눅스 파일 퍼미션만을 지원하는 오래된 프로그램들에 대한 호환성을 유지하는 것도 필요합니다[^compat].

[^pure-acl]: <https://fas.org/irp/nsa/rainbow/tg020-a.htm>

    > Barring compatibility, the alternatives of ACLs replacing file permission bits (Pure ACLs and On Demand) would be the most elegant way of enhancing DAC for UNIX systems. By abandoning file permission bits, however, these schemes have been rendered incompatible with existing systems. Thus, they are not considered for a POSIX-compliant UNIX system DAC scheme.

[^compat]: <https://fas.org/irp/nsa/rainbow/tg020-a.htm>

    > The relationship between the ACL and the file permission bits is important to existing programs in order to maintain compatibility.

그래서 ACL은 파일 퍼미션과의 호환성을 유지하기 위해 파일 퍼미션과 **매핑** 관계를 형성합니다. 파일 퍼미션이 변경되면 관련된 ACL도 변경되며, ACL이 변경되면 그에 따른 파일 퍼미션 역시 변경됩니다. 기존 파일 퍼미션도 ACL 정보로 표시되며, ACL 명령어로 제어할 수 있습니다[^mapping].

[^mapping]:
    <https://www.usenix.org/legacy/publications/library/proceedings/usenix03/tech/freenix03/full_papers/gruenbacher/gruenbacher_html/main.html>

    > When an application changes any of the owner, group, or other class permissions (e.g., via the chmod command), the corresponding ACL entry changes as well. Likewise, when an application changes the permissions of an ACL entry that maps to one of the user classes, the permissions of the class change.

### `user::<권한>`

`user` 타입과 함께 사용자 이름을 비워두면 리눅스 파일 퍼미션에서의 **소유자**에게 권한을 부여합니다. 이 항목은 `chmod`에 의해 기존 파일 퍼미션이 바뀔 경우 따라 바뀝니다. 그 반대도 마찬가지입니다.

- `user::rwx`: 소유자에게 읽기(`r`), 쓰기(`w`), 실행(`w`) 권한을 부여합니다.

### `group::<권한>`

`group` 타입과 함께 그룹 이름을 비워두면 리눅스 파일 퍼미션에서의 **소유 그룹**에게 권한을 부여합니다. 이 항목 또한 `chmod`에 의해 기존 파일 퍼미션이 바뀔 경우 따라 바뀝니다. 그 반대도 마찬가지입니다.

- `group::r-x`: 소유 그룹에게 읽기(`r`), 실행(`x`) 권한을 부여합니다.

### `other::<권한>`

`other`는 **기타 사용자**에게 권한을 부여합니다. 이 항목 역시 `chmod`의 영향을 받습니다:

- `setfacl --modify other::r-- my-test-file`: 기타 사용자에게 읽기 권한(`r`)만을 부여합니다.

### `mask::<권한>`

`mask`(마스크) 타입은 기존 파일 퍼미션과의 호환성을 위해 존재하는 타입입니다. 다음 장에서 설명합니다.

## 마스크 타입

### 호환성을 위해 의존이 필요하다

앞서 말씀드렸듯 ACL은 기존 리눅스 파일 퍼미션과의 호환성을 확보하는 것이 중요합니다. 특히 파일 퍼미션에서 `chmod 000 my-test-file`과 같이 모든 권한을 제거하는 명령을 실행한다면, 소유자와 소유 그룹이 아닌 사용자와 그룹에게 부여한 권한 역시 모두 제거되도록 하는 호환성이 확보되어야 합니다[^chmod-compat].

[^chmod-compat]: <https://fas.org/irp/nsa/rainbow/tg020-a.htm#HDR6%202%2024>

    > ... use of chmod("object" 0) should continue to work, denying subsequent opens to an object.

이를 위해 ACL은 소유자와 소유 그룹이 아닌 사용자와 그룹에게 부여한 권한이 기존 파일 퍼미션(소유자, 소유 그룹, 기타 사용자)에 **의존**하도록 하여 호환성을 유지합니다.

이 **의존**이라는 말은 파일 퍼미션의 소유 그룹 권한보다 더 많은 권한을 줄 수 없도록 막음을 의미합니다. 즉, **파일 퍼미션의 소유 그룹 권한이 `rw-`라면 ACL의 사용자 타입(`user:<사용자 이름>:<권한>`), 그룹 타입(`group:<사용자 이름>:<권한>`) 또한 `rw-` 이상의 권한을 가질 수 없게 막겠다**는 소리죠.

(`getfacl` 명령을 실행한다면 실제 적용되는 권한이 항목 옆에 주석으로 `# effective:rw-`처럼 표시될 것입니다.)

### 셋 중 어느 권한에 의존해야 하는가

다만 여기서 문제점이 발생합니다. 기존 파일 퍼미션은 소유자, 소유 그룹, 기타 사용자로 세 개의 권한이 존재하는데, **셋 중 어느 권한에 의존**해야 까요?

**소유자 권한에 의존:** 추가적인 ACL 항목이 소유자 권한에 의존할 수는 없습니다. ACL을 지원하지 않으면서 '소유자 전용' 파일이나 디렉터리를 만드는 프로그램들이 제대로 권한을 제한할 수 없기 때문입니다. 사용자 항목, 그룹 항목이 소유자 권한에 의존한다고 합시다. 이때 아무리 파일 퍼미션을 통해 `chmod 700`, `chmod 755`를 통하여 소유자 전용으로 바꾸어봤자 다른 사람들도 ACL 항목에 명시되어 있다면 접근이 가능합니다.

**다른 사용자 권한에 의존:** 그렇다고 다른 사용자 권한에 의존하는 것도 위험합니다. 사용자와 그룹 타입이 다른 사용자 권한에 의존한다면, 사용자와 그룹 타입이 원활히 동작하기 위해 다른 사용자 권한을 가급적 넓게 열어두어야 합니다. 다른 사용자 권한을 넓게 열어두는 것은 보안 문제를 일으킬 수 있습니다.

**소유 그룹 권한에 의존:** **그나마 문제가 적은 게 소유 그룹 권한에 의존**하는 것입니다. 물론 이것도 소유 그룹에게만 권한을 주는 프로그램들이 제대로 동작하지 못할 우려가 있지만 소유자나 다른 사용자에게 의존하는 것에 비해 문제를 덜 일으킵니다[^preferred-masking-field].

[^preferred-masking-field]:
    <https://fas.org/irp/nsa/rainbow/tg020-a.htm#HDR6.7%203%2031>

    > The file group class permission bits are the preferred masking field, even though they encourage permissive default access by the owning group. This choice must be made because the use of the file owner class would cause compatibility problems in programs which attempt to establish "owner-only" access, whereas the designation of the file other class could leave objects open to attack were an ACL removed or never present. An additional option of masking user entries with the file owner class permission bits and group entries with the file group class permission bits has the same disadvantages as masking against only the file owner class. When masking against the file group class, the permissions indicate the least upper bound of the permissions allowed for the ACL entries and the user and other fields retain their previous semantics.

### 마스크 타입의 도입

ACL 사용자 타입, 그룹 타입이 파일 퍼미션의 소유 그룹 권한에 의존할 경우, 자유롭게 소유 그룹의 변환을 변경할 수 없습니다. 파일 퍼미션의 소유 그룹 권한을 변경한다면 **ACL 사용자 타입과 그룹 타입 모두 영향을 받기 때문**입니다.

ACL에서는 이 문제를 해결하기 위해, 파일 퍼미션의 소유 그룹 권한을 ACL 소유 그룹 타입(`group::<권한>`)에 매핑하지 않고 대신 **마스크 타입**(`mask::<권한>`)이라는 특수한 타입에 매핑합니다[^virtue-of-the-mask-entry]. 다만 파일 퍼미션의 소유 그룹 권한을 마스크 타입에 매핑한 상태에서도 ACL에서의 소유 그룹 권한은 소유 그룹 타입(`group::<권한>`)으로서 여전히 존재하게 됩니다. 조금 말이 어렵지만, 표로 정리하자면 다음과 같습니다:

[^virtue-of-the-mask-entry]:
    <https://www.usenix.org/legacy/publications/library/proceedings/usenix03/tech/freenix03/full_papers/gruenbacher/gruenbacher_html/main.html>

    > This problem is solved by the virtue of the mask entry. With minimal ACLs, the group class permissions map to the owning group entry permissions. With extended ACLs, the group class permissions map to the mask entry permissions, whereas the owning group entry still defines the owning group permissions. The mapping of the group class permissions is no longer constant.

|                 | 파일 퍼미션 매핑 대상 | 파일 퍼미션 매핑 권한 |
| --------------- | --------------------- | --------------------- |
| `user::<권한>`  | 소유자                | 소유자의 권한         |
| `group::<권한>` | 소유 그룹             |                       |
| `mask::<권한>`  |                       | 소유 그룹의 권한      |
| `other::<권한>` | 기타 사용자           | 기타 사용자의 권한    |

**다만 ACL에서 사용자 타입 항목이나 그룹 타입 항목을 전혀 추가하지 않은 경우 (파일 퍼미션과 별다른 게 없는 경우) 마스크 타입은 만들어지지 않습니다[^extended-acls-contain-mask-entry]:**

[^extended-acls-contain-mask-entry]:
    <https://www.usenix.org/legacy/publications/library/proceedings/usenix03/tech/freenix03/full_papers/gruenbacher/gruenbacher_html/main.html>

    > ACLs equivalent with the file mode permission bits are called minimal ACLs. They have three ACL entries. ACLs with more than the three entries are called extended ACLs. Extended ACLs also contain a mask entry and may contain any number of named user and named group entries.

|                 | 파일 퍼미션 매핑 대상 | 파일 퍼미션 매핑 권한 |
| --------------- | --------------------- | --------------------- |
| `user::<권한>`  | 소유자                | 소유자의 권한         |
| `group::<권한>` | 소유 그룹             | 소유 그룹의 권한      |
| `other::<권한>` | 기타 사용자           | 기타 사용자의 권한    |

## 기본값 ACL

기본값 ACL은 **디렉터리 단위로 `umask`와 `usermod --gid`를 적용하는 듯한 효과**를 나타낼 수 있는 기능입니다.

디렉터리에만 기본값 ACL을 지정해줄 수 있습니다. 해당 디렉터리 내에서 만들어지는 파일들은 자신이 속한 디렉터리의 기본값 ACL을 따르게 됩니다[^default-acl-affects-subdirs-and-files].

[^default-acl-affects-subdirs-and-files]:
    <https://linuxgazette.net/152/prestia.html>

    > Directories can have a default ACL, which defines the access permissions that files under the directory inherit when they are created. A default ACL affects subdirectories as well as files.

하위 디렉터리는 부모의 기본값 ACL로 인해 자신의 ACL을 결정지을 뿐만 아니라, 기본값 ACL 자체도 그대로 물려받습니다[^default-acl-inheritance].

[^default-acl-inheritance]: <https://linuxgazette.net/152/prestia.html>

    > Notice that "week1" will inherit the default ACL permissions of the parent directory "work":

### `default:<타입>:<사용자 또는 그룹 이름>:<권한>`

일반적인 항목 앞에 `default:`를 추가하면 기본값 ACL이 됩니다.

### 파일에는 기본값 실행(`x`) 권한이 적용되지 않는다

디렉터리에 `default:user::r-x`라 명시한 뒤 `touch` 명령어를 이용해 파일을 생성해도 파일에는 실행(`x`) 권한이 적용되지 않는 것을 확인할 수 있습니다. 이는 다음 이유 때문입니다:

- 디폴트 ACL이 적용되기 전에, `touch`로 생성되는 파일은 시스템으로부터 기본적인 파일 퍼미션으로서 소유자, 소유 그룹, 기타 사용자 모두 `rw-`를 부여받습니다[^touch-mode]. 이는 `touch`뿐만 아니라 `mkdir`같은 다른 명령어에도 적용됩니다. `mkdir`의 경우 소유자, 소유 그룹, 기타 사용자 모두 `rwx`를 부여받습니다.
- 시스템에서 생성한 파일에 권한이 있고 디폴트 ACL도 해당 권한이 있어야만 생성한 파일의 권한을 그대로 유지합니다. 둘 중 한 곳에도 없다면 권한을 부여받지 못합니다. 소유자만 살펴봅시다. 앞의 예시에서 ACL의 기본값 소유자 타입은 `r-x`고 `touch`의 소유자 기본 권한은 `rw-`입니다. 둘 모두 `r`이 존재하므로, 최종적으로 만들어지는 파일은 `r` 권한만을 가집니다. `x`는 디폴트 ACL에만 존재하기에 적용되지 않습니다. `w` 역시 `touch`의 소유자 기본 권한에만 존재하므로 적용되지 않습니다.

[^touch-mode]:
    <https://www.usenix.org/legacy/publications/library/proceedings/usenix03/tech/freenix03/full_papers/gruenbacher/gruenbacher_html/main.html>

    > Unless otherwise specified, the mkdir command uses a value of 0777 as the mode parameter to the mkdir system call, which it uses for creating the new directory.
    > The touch command passes a mode value of 0666 to the kernel for creating the file.

## 기타

### `setfacl --recursive`

`setfacl --recursive`는 모든 하위 파일과 디렉터리에 재귀적으로 ACL 항목을 적용합니다.

- `setfacl --recursive --modify other::r-x my-test-dir`: `my-test-dir` 디렉터리와 모든 하위 파일 및 디렉터리에 `other::r-x` 항목을 추가합니다.

### `setfacl`과 대문자 X

`setfacl`로 권한을 지정할 때 실행 권한을 뜻하는 `x` 대신 `X`를 쓸 수도 있습니다. 이는 **해당 대상이 디렉터리거나 이미 실행 권한이 있는 파일**에만 퍼미션을 줍니다. 실행 권한을 과도하게 주지 않고 꼭 필요한 대상에게만 주기에 유용한 기능입니다[^capital-x].

[^capital-x]: <https://linux.die.net/man/1/setfacl>

    > ... execute only if the file is a directory or already has execute permission for some user (X).

## 예제: 소스 코드 디렉터리에 기본값 ACL 주기

깃(Git)으로 클론한 프로젝트를 여러 사람이 함께 편집하는 경우 각자 `git checkout`이나 `get pull` 명령을 실행할 때마다 소유 권한이 바뀌어 혼란스럽게 됩니다. 이때 모든 사용자를 하나의 그룹에 속하게 한 뒤, 그 그룹에 권한을 부여하는 식으로 문제를 해결할 수 있습니다. 기본값 ACL을 부여한다면 프로젝트 안에서 파일을 생성하거나 수정해도 항상 원하는 권한을 유지할 수 있게 됩니다.

다음 명령어는 `/opt/proj` 디렉터리에 대하여 `developers` 그룹에 모든 권한을 부여하는 ACL 항목, 그리고 기본값 ACL 항목을 적용합니다. 이후 `git clone`을 통해 깃을 복제합니다:

```sh
sudo mkdir /opt/proj
sudo setfacl --modify group:developers:rwx /opt/proj
sudo setfacl --modify default:group:developers:rwx /opt/proj

git clone https://www.example.com/proj.git /opt/proj
```

이미 `/opt/proj` 디렉터리가 존재한다면 `setfacl --recursive`를 통해 재귀적으로 ACL 항목을 적용할 수도 있습니다:

```sh
sudo setfacl --recursive --modify group:developers:rwX /opt/proj
sudo setfacl --recursive --modify default:group:developers:rwX /opt/proj
```

## 참고

- <https://unix.stackexchange.com/questions/268090/example-of-situation-where-acl-unaware-tools-would-grant-unintended-permssions>

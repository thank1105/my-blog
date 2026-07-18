# Prisma 6.19.3 �� ��֪��������ʱ����

> ��¼�� Phase 0 ����ʱ���ֵ������봦�÷�ʽ����һ������ `docs/technology-baseline.md` ʱ����

## Windows + Prisma 6.19.3 schema-engine ����ȱ��

**����**

��ȫ�»�����`prisma/dev.db` �����ڣ��״�ִ�� `pnpm prisma db push` ʱ��Prisma CLI �������Ƕ�� `schema-engine-windows.exe` ���� `can-connect-to-database` �� `create-database` �����֡�schema-engine �� JSON ��־����д�� stderr���� Prisma CLI �ڵ� `ape()` ���������� stderr ��ͷ��һ�з� JSON �� banner���� `slice(1)` ��������֮���ٽ���ʣ�µ����ݡ�Windows �����Ʋ������ banner�������׸� JSON �б�������ʣ��Ϊ�գ������׳����κ� `error_code` / `message` �ı��� `Error: Schema engine error:`��

**��ʱ����**

�ֿ��Ŀ¼�� `scripts/db-prepare.cjs` �������� `pnpm prisma:push`��`pnpm dev`��`pnpm prisma:migrate` ֮ǰԤ�����յ� `prisma/dev.db`���� schema-engine ֱ�ӽ��� ��DB �Ѵ��ڡ� ��·�����Ӷ��ƹ��Ǹ���ȱ�ݵ� `create-database` ���̡��ű����ע��˵������ Prisma �����޸����� 6.19.x �����������Ƴ�������ʱͬ��������

**���󴥷�**

- ������ 6.20.x ����� Prisma �汾��baseline ���󣩡�
- ���� Prisma �ڸ� issue �����޸� release��
- ���ǻ��� macOS / Linux ������������Ŀǰ���� Windows ���֣���

## dotenvx ������

`pnpm prisma ...` �������� `.env` ���ػ���������`@dotenvx/dotenvx` ���� stderr ��ӡ `Environment variables loaded from .env`��PowerShell ����κ� stderr ����ʶ��Ϊ `NativeCommandError`������ `$LASTEXITCODE` ���Ʒ��㡪���ű�ʵ�ʷ��������� 0������ִ�гɹ������账�ã������������̫�󣬿������� PowerShell �� 7+��stderr ���ٱ�����ʶ�𣩡�

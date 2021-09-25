# Topo

Automated generation of daily todolist through configuration file (toml, yaml, json5 or ini)
, [Mind Map](https://en.wikipedia.org/wiki/Mind_map) or [Flow Diagram](https://en.wikipedia.org/wiki/Flow_diagram)

## Algorithm List

+ [Greedy Algorithm](https://en.wikipedia.org/wiki/Greedy_algorithm)
+ [Ford–Fulkerson algorithm (Maximum Flow)](https://en.wikipedia.org/wiki/Ford%E2%80%93Fulkerson_algorithm)

## Configuration

the default path to the configuration is `/home/${user}/.config/topo/topo.yaml`

```yaml
intervals:
- id: 1
  name: 上午
  start: 9h
  end: 11.5h
- id: 2
  ...
blocks:
- id: 1
  name: 科研
  estimated: 0
  charger:
  - name: 网络调研
    estimated: 30d
    maxTime: 1h
  - name: 论文阅读
    estimated: 30d
    percent: 10
    maxTime: 1h
  - name: 代码
    estimated: 30d
    percent: 30
  - name: 实验
    estimated: 30d
  - ...
topology:
  workTime: 12h
  defaultIntervalId: 3
  blockPriority:
  - 1
  - 2
  - 3
  blockAffinity:
  - intervalId: 1
    blockId: 1
    bulletName: 网络调研
  - intervalId: 2
    ...
  bulletForbidden:
  - blockId: 1
    bulletName: 实验
  - blockId: 1
    bulletName: 写作
  blockPercents:
  - intervalId: 1
    percent: 70
  - intervalId: 2
    percent: 20
```

## Topo Result Reporter Implementation

+ [notifier](https://www.npmjs.com/package/node-notifier)
+ email
+ logger
+ web page


@echo off
REM build-kg.bat -- 重建知识图谱数据 (call 即可,ASCII only)
cd /d "E:\OH-workspace\antenna-tracker"
python scripts\build-kg-from-notes.py

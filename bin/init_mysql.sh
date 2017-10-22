#!/bin/bash


mysql -u$1 -p$2 -e 'drop database cs527'

mysql -u$1 -p$2 < schema_init.sql

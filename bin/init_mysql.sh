#!/bin/bash


mysql -ucs527 -pmegaman4 -e 'drop database cs527'

mysql -ucs527 -pmegaman4 < schema_init.sql
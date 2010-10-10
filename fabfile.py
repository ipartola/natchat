from __future__ import with_statement
from fabric.api import *

env.user = 'igor'
env.hosts = ['natchat.com']
env.root = '/var/node'
env.site = 'natchat'
env.tarfile = '%(site)s.tar' % env

def build():
	local('git archive master --prefix=%(site)s/ -o /tmp/%(tarfile)s' % env)
	local('cd /tmp && bzip2 %(tarfile)s' % env)

def upload():
	build()

	put('/tmp/%(tarfile)s.bz2' % env, '/var/tmp/%(tarfile)s.bz2' % env)
	local('rm /tmp/%(tarfile)s.bz2' % env)

	run('cd /var/tmp && tar -xjf %(tarfile)s.bz2' % env)
	run('rsync --omit-dir-times -av /var/tmp/%(site)s/ %(root)s/%(site)s/' % env)
	run('rm -rf /var/tmp/%(site)s /var/tmp/%(tarfile)s.bz2' % env)


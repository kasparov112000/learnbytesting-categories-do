@NonCPS
public debug(msg) {

    try {
        //ansiColor('xterm') {
            echo "\033[1;34m[Debug] \033[0m ${msg}"
        //}
    } catch (e) {
        error "${e}"
    }
}

public info(msg) {
    ansiColor('xterm') {
        echo "\033[1;32m${msg}\033[0m"
    }
}

public error(msg) {
    ansiColor('xterm') {
        echo "\033[1;31m[Error] \033[0m ${msg}"
    }
}

public warning(msg) {
    ansiColor('xterm') {
        echo "\033[1;33m[Warning] \033[0m ${msg}"
    }
}

//http://testerfenster.com/blog/jenkins-tutorials-add-color-to-console-output/


def require(moduleName) {
    def branch = "master"
    if ( "${env['flag-feature-toggling']}" == "yes" ) {
        if ( env['flag-feature-toggling-branch'] != null ) {
            branch = "${env['flag-feature-toggling-branch']}"
        }
    }
    def url = "https://bot:c97fad6078faf9b93a5b7c9d00fae0d3186cadc3@github.pwc.com/raw/EasyDevOps/pipeline/${branch}/${moduleName}.groovy"
    sh """#!/bin/bash
    curl -s -o ./pipeline.lib.groovy "${url}"
    """
    def func = load("./pipeline.lib.groovy")
    return func
}

return this
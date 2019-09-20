#!groovy

import groovy.json.JsonOutput
import groovy.transform.Field
import groovy.json.JsonSlurperClassic
import groovy.json.JsonBuilder
import jenkins.model.*
import hudson.scm.ChangeLogSet

def envVars = env.getEnvironment()

def err = null
currentBuild.result = "SUCCESS"

def notify(String result, String stage) {
  result = result ? 'FAILED': 'SUCCESS'

  emailext attachLog: true, body: '', subject: '$PROJECT_NAME - Build # $BUILD_NUMBER - $BUILD_STATUS:', to: 'rahul.garg@monotype.com'
}


// Build starts here. We put this in a try/except/finally block so that we can
// perform post-build actions (such as Slack notifications).
node("linux-php") {

    stage('Clean workspace before build') {
      deleteDir()
    }

    stage('Code checkout') {
      checkout([$class: 'GitSCM',
      branches: [[name: '*/trim-fix-alpha']],
      gitTool: 'Default',
      userRemoteConfigs: [[credentialsId: 'Jenkins-Monotype-Github',
      url: 'https://github.com/Monotype/sharp.git']]]
      )
    }

    stage("Upload Package to Artifactory") {
      withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'artifactbackup', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
      sh """
      cd ${WORKSPACE}/
      curl -u$USERNAME:$PASSWORD https://artifact.monotype.com/artifactory/api/npm/auth >> ~/.npmrc
      curl -u$USERNAME:$PASSWORD https://artifact.monotype.com/artifactory/api/npm/npm/auth/@monotype >> ~/.npmrc
      cat ~/.npmrc >> .npmrc
      npm publish --registry https://artifact.monotype.com/artifactory/api/npm/npm/
      """
      }
    }
}
# Jenkins Docker Compose Deployment

## Overview

This directory contains a Docker Compose configuration for deploying SonarQube with PostgreSQL database backend. SonarQube is commonly integrated with Jenkins CI/CD pipelines for continuous code quality inspection and static code analysis. This setup provides a containerized environment for running code quality checks as part of your Jenkins workflows.

## Jenkins Concepts

This deployment demonstrates the following DevOps and CI/CD concepts:

- **Integration with Code Quality Tools**: SonarQube integration with Jenkins pipelines
- **Containerized Infrastructure**: Using Docker Compose for reproducible development environments
- **Service Dependencies**: Managing multi-container applications with dependent services
- **Persistent Storage**: Volume management for data persistence across container restarts
- **Environment Configuration**: External configuration through environment variables
- **Database Backend**: PostgreSQL integration for SonarQube data storage

## Prerequisites

Before deploying this environment, ensure you have:

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 1.29 or higher)
- At least 2GB of available RAM for SonarQube
- At least 5GB of available disk space for volumes
- Basic understanding of Docker and container orchestration
- Port 9000 available on your host machine

## Project Structure

```
docker-compose/
|-- docker-compose.yml    # Main Docker Compose configuration
|-- README.md            # This documentation file
```

### Key Components

The deployment consists of two main services:

1. **SonarQube Service**
   - Image: `sonarqube:lts` (Long-Term Support version)
   - Port: 9000 (mapped to host)
   - Database: PostgreSQL backend
   - Volumes: Data, extensions, and logs persistence

2. **PostgreSQL Database**
   - Image: `postgres:13`
   - Database: sonarqube
   - User: sonar
   - Volumes: PostgreSQL data persistence

## Pipeline Configuration

### Docker Compose Configuration Details

```yaml
services:
  sonarqube:
    image: sonarqube:lts
    container_name: sonarqube
    depends_on:
      - db
    ports:
      - "9000:9000"
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonarqube
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonarpassword
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

  db:
    image: postgres:13
    container_name: postgres
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonarpassword
      POSTGRES_DB: sonarqube
    volumes:
      - postgresql_data:/var/lib/postgresql/data
```

### Volume Configuration

Four named volumes are defined for data persistence:

- `sonarqube_data`: SonarQube application data
- `sonarqube_extensions`: SonarQube plugins and extensions
- `sonarqube_logs`: SonarQube application logs
- `postgresql_data`: PostgreSQL database files

## Usage

### Starting the Environment

1. Navigate to the docker-compose directory:
   ```bash
   cd /Users/reza/home-lab/Jenkins/docker-compose
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Verify the services are running:
   ```bash
   docker-compose ps
   ```

4. Check the logs:
   ```bash
   docker-compose logs -f
   ```

### Accessing SonarQube

1. Wait for SonarQube to fully start (approximately 1-2 minutes)
2. Open your browser and navigate to: `http://localhost:9000`
3. Default credentials:
   - Username: `admin`
   - Password: `admin`
4. You will be prompted to change the password on first login

### Configuring Jenkins Integration

To integrate this SonarQube instance with Jenkins:

1. Install the SonarQube Scanner plugin in Jenkins
2. Configure SonarQube server in Jenkins:
   - Go to: Manage Jenkins > Configure System
   - Add SonarQube server:
     - Name: `sonarqube-server`
     - Server URL: `http://localhost:9000`
     - Authentication token: Generate in SonarQube (User > My Account > Security > Generate Token)

3. Configure SonarQube Scanner in Jenkins:
   - Go to: Manage Jenkins > Global Tool Configuration
   - Add SonarQube Scanner installation

4. Use in Jenkins pipeline (example from Practice directory):
   ```groovy
   stage('SonarQube Analysis') {
       steps{
           script{
               def mvn = tool 'Maven';
               withSonarQubeEnv(installationName: 'sonarqube-server') {
                   sh "${mvn}/bin/mvn clean verify sonar:sonar -Dsonar.projectKey=your-project -Dsonar.projectName='Your Project'"
               }
           }
       }
   }
   ```

### Stopping the Environment

Stop the services while preserving data:
```bash
docker-compose stop
```

Stop and remove containers (data persists in volumes):
```bash
docker-compose down
```

Remove everything including volumes (CAUTION: This deletes all data):
```bash
docker-compose down -v
```

## Key Features

1. **Long-Term Support Version**: Uses SonarQube LTS for stability and extended support
2. **Database Persistence**: PostgreSQL backend ensures data durability
3. **Volume Management**: Named volumes for easy backup and migration
4. **Service Dependencies**: Automatic startup order with `depends_on`
5. **Network Isolation**: Services communicate on a dedicated Docker network
6. **Easy Configuration**: Environment variables for flexible setup
7. **Container Naming**: Named containers for easier management and debugging

## Troubleshooting

### SonarQube Won't Start

**Issue**: Container starts but SonarQube is not accessible

**Solution**:
1. Check container logs:
   ```bash
   docker-compose logs sonarqube
   ```
2. Ensure sufficient memory (minimum 2GB RAM)
3. Increase Docker memory limits if needed
4. Wait longer - initial startup can take 2-3 minutes

### Database Connection Errors

**Issue**: SonarQube cannot connect to PostgreSQL

**Solution**:
1. Verify database container is running:
   ```bash
   docker-compose ps db
   ```
2. Check database logs:
   ```bash
   docker-compose logs db
   ```
3. Verify environment variables match between services
4. Restart both services:
   ```bash
   docker-compose restart
   ```

### Port Already in Use

**Issue**: Port 9000 is already allocated

**Solution**:
1. Check what's using port 9000:
   ```bash
   lsof -i :9000
   ```
2. Either stop the conflicting service or modify the port mapping in docker-compose.yml:
   ```yaml
   ports:
     - "9001:9000"  # Maps host port 9001 to container port 9000
   ```

### Data Persistence Issues

**Issue**: Data is lost after restarting containers

**Solution**:
1. Verify volumes exist:
   ```bash
   docker volume ls | grep sonarqube
   ```
2. Ensure you're not using `docker-compose down -v` which removes volumes
3. Check volume permissions if on Linux
4. Backup volumes regularly:
   ```bash
   docker run --rm -v sonarqube_data:/data -v $(pwd):/backup alpine tar czf /backup/sonarqube_backup.tar.gz -C /data .
   ```

### Memory Issues

**Issue**: SonarQube crashes or performs poorly

**Solution**:
1. Increase Docker Desktop memory allocation (minimum 2GB, recommended 4GB)
2. Add memory limits to docker-compose.yml:
   ```yaml
   services:
     sonarqube:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

## Best Practices

1. **Security**
   - Change default SonarQube admin password immediately
   - Use strong passwords for PostgreSQL
   - Consider using Docker secrets for sensitive data in production
   - Restrict network access to SonarQube port

2. **Data Management**
   - Regular backup of Docker volumes
   - Monitor disk space usage
   - Implement log rotation for sonarqube_logs volume
   - Document backup and restore procedures

3. **Performance Optimization**
   - Allocate sufficient memory (4GB+ for production)
   - Use SSD storage for volumes
   - Monitor resource usage with `docker stats`
   - Consider scaling SonarQube with additional web servers for high load

4. **Maintenance**
   - Keep SonarQube and PostgreSQL images updated
   - Review and clean up old analysis data periodically
   - Monitor database size and perform vacuuming
   - Test backup and restore procedures regularly

5. **Development Workflow**
   - Use this setup for local development and testing
   - Configure quality gates before merging code
   - Integrate SonarQube analysis in all Jenkins pipelines
   - Review and act on SonarQube findings regularly

6. **Production Considerations**
   - Use specific version tags instead of `lts` or `latest`
   - Implement proper logging and monitoring
   - Use reverse proxy (nginx/traefik) for SSL/TLS
   - Consider managed database services for production
   - Implement automated backup solutions

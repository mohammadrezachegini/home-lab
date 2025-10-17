# Ansible Practice

A comprehensive Ansible learning repository demonstrating various modules, playbooks, and automation techniques for system administration and configuration management.

## Repository Structure

```
Ansible-Practice/
├── README.md
└── provision/
    ├── inventory/
    │   └── anisblehosts          # Inventory file with host groups
    ├── myproject.yml             # Main playbook
    └── roles/
        └── myproject/
            ├── defaults/
            │   └── main.yml
            ├── files/
            │   ├── file1
            │   ├── main.yml
            │   └── test.sh
            ├── handlers/
            │   └── main.yml      # Service restart handlers
            ├── meta/
            │   └── main.yml
            ├── tasks/
            │   ├── main.yml      # Primary task definitions
            │   ├── prj1.yml
            │   └── prj2.yml
            ├── templates/
            │   ├── rocky-nginx.conf.j2
            │   └── ubuntu-nginx.conf.j2
            └── vars/
                └── main.yml      # Variable definitions
```

## Features

This repository demonstrates the following Ansible concepts and modules:

### Core Modules
- **File Management**: `file`, `copy`, `fetch`, `lineinfile`, `replace`
- **Package Management**: `yum`, `apt`, `yum_repository`
- **Service Management**: `service` with handlers
- **User Management**: `user`, `group`
- **Archive Operations**: `archive`, `unarchive`
- **Database Management**: `mysql_db`, `mysql_user`

### Advanced Features
- **Templating**: Jinja2 templates for NGINX configuration
- **Conditional Logic**: OS family detection and conditional tasks
- **Loops**: Various loop types including `with_items`, `with_nested`
- **Error Handling**: Retry mechanisms and error ignoring
- **Asynchronous Tasks**: Long-running operations
- **Fact Gathering**: System information collection

### Infrastructure Components
- **Web Server**: NGINX installation and configuration
- **Database**: MariaDB setup and management
- **Version Control**: Git repository cloning
- **System Administration**: Timezone, reboot, package updates

## Quick Start

### Prerequisites
- Ansible installed on control node
- SSH access to target hosts
- Sudo privileges on target systems

### Configuration

1. **Update Inventory**: Modify `provision/inventory/anisblehosts` with your server details:
```ini
[myservers]
192.168.68.3 ansible_user=your_user
192.168.68.4 ansible_user=your_user
```

2. **Configure Variables**: Edit `provision/roles/myproject/vars/main.yml`:
```yaml
user:
  name: your_username
  email: your_email@domain.com
mysql_root_password: your_secure_password
```

### Running Playbooks

Execute the main playbook:
```bash
ansible-playbook -i provision/inventory/anisblehosts provision/myproject.yml
```

Run specific tasks using tags:
```bash
# Install and configure NGINX
ansible-playbook -i provision/inventory/anisblehosts provision/myproject.yml --tags "yum_module,template_module,service_module"

# Database setup
ansible-playbook -i provision/inventory/anisblehosts provision/myproject.yml --tags "install-mariadb,mysql_db_module"

# File operations
ansible-playbook -i provision/inventory/anisblehosts provision/myproject.yml --tags "create_dir,copy_module"
```

## Available Tags

The playbook includes numerous tags for selective execution:

### System Management
- `create_dir`, `create_file` - File system operations
- `yum_module`, `apt_module` - Package management
- `service_module` - Service control
- `user_module`, `group_module` - User management

### Application Setup
- `template_module` - Configuration templating
- `install-mariadb` - Database installation
- `mysql_db_module` - Database operations
- `git_mode` - Repository cloning

### Advanced Operations
- `loop1`, `loop2`, `loop3` - Loop demonstrations
- `reboot_module` - System reboot
- `archive_module`, `unarchive_module` - Archive operations
- `wait_module` - Wait conditions

## Learning Examples

### Multi-OS Support
The playbook demonstrates cross-platform compatibility:
```yaml
- name: Install NGINX on RedHat systems
  yum:
    name: nginx
    state: latest
  when: ansible_facts['os_family'] == 'RedHat'

- name: Install NGINX on Debian systems
  apt:
    name: nginx
    state: latest
  when: ansible_facts['os_family'] == 'Debian'
```

### Dynamic Configuration
Uses Jinja2 templates for environment-specific configurations:
- `rocky-nginx.conf.j2` - RHEL/CentOS configuration
- `ubuntu-nginx.conf.j2` - Debian/Ubuntu configuration

### Loop Patterns
Various loop implementations:
```yaml
# Simple list iteration
- name: Create multiple files
  file:
    path: /home/user/{{ item }}
    state: touch
  with_items:
    - file1
    - file2

# Nested loops for complex operations
- name: Create users with database privileges
  mysql_user:
    name: '{{ item[0] }}'
    priv: '{{ item[1] }}.*:ALL'
  with_nested:
    - ['user1', 'user2']
    - ['db1', 'db2']
```

## Inventory Management

The inventory file supports multiple group configurations:

- **myservers**: Main server group with common variables
- **Group_A**: Subset with priority settings
- **Group_B**: Alternative configuration group
- **Variable precedence**: Demonstrates group priority handling

## Security Considerations

- Variables for sensitive data (passwords, keys)
- Backup creation before configuration changes
- User privilege management
- Service security configurations

## Testing and Validation

The repository includes validation mechanisms:
- Package installation verification
- Service status checking
- Configuration file validation
- Database connectivity testing


## Troubleshooting

### Common Issues
- **Connection failures**: Verify SSH access and user permissions
- **Package conflicts**: Check OS compatibility and repository availability  
- **Service startup**: Ensure required dependencies are installed
- **Template errors**: Validate Jinja2 syntax and variable availability

### Debug Mode
Run with verbose output for troubleshooting:
```bash
ansible-playbook -i inventory/anisblehosts myproject.yml -vvv
```
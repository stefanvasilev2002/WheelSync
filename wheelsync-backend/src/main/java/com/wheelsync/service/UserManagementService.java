package com.wheelsync.service;

import com.wheelsync.dto.user.CreateUserRequest;
import com.wheelsync.dto.user.UserResponse;
import com.wheelsync.dto.user.UserUpdateRequest;
import com.wheelsync.entity.Company;
import com.wheelsync.entity.User;
import com.wheelsync.entity.enums.Role;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.EmailAlreadyExistsException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.CompanyRepository;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, UserPrincipal principal) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Role role;
        Company company;

        if (isAdmin) {
            role = request.getRole() != null ? request.getRole() : Role.DRIVER;
            company = null;
            if (request.getCompanyId() != null) {
                company = companyRepository.findById(request.getCompanyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Company", request.getCompanyId()));
            }
        } else {
            // Fleet Manager: can only create DRIVERs, auto-assigned to their company
            role = Role.DRIVER;
            Long companyId = principal.getCompanyId();
            if (companyId == null) {
                throw new AccessDeniedException("Fleet Manager must belong to a company to create users");
            }
            company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .company(company)
                .isActive(true)
                .build();

        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAll(UserPrincipal principal) {
        List<User> users;
        if (principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            users = userRepository.findAll();
        } else {
            Long companyId = principal.getCompanyId();
            if (companyId == null) {
                throw new AccessDeniedException("Access denied to users");
            }
            users = userRepository.findAll().stream()
                    .filter(u -> u.getCompany() != null && companyId.equals(u.getCompany().getId()))
                    .collect(Collectors.toList());
        }
        return users.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User",id));

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Long companyId = principal.getCompanyId();
            if (companyId == null || user.getCompany() == null
                    || !companyId.equals(user.getCompany().getId())) {
                throw new AccessDeniedException("Access denied to this user");
            }
        }

        return toResponse(user);
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User",id));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        if (request.getCompanyId() != null) {
            Company company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", request.getCompanyId()));
            user.setCompany(company);
        } else if (request.getRole() != null && request.getRole() == Role.ADMIN) {
            user.setCompany(null);
        }

        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void deactivate(Long id, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User",id));

        if (principal.getId().equals(id)) {
            throw new IllegalArgumentException("You cannot deactivate your own profile");
        }

        user.setIsActive(false);
        userRepository.save(user);
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
